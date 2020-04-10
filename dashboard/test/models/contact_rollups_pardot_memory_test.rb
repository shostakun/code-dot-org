require 'test_helper'
require 'cdo/contact_rollups/v2/pardot'

class ContactRollupsPardotMemoryTest < ActiveSupport::TestCase
  test 'add_and_update_pardot_ids inserts new mappings' do
    assert_equal 0, ContactRollupsPardotMemory.count

    new_mappings = [
      {email: "alex@rollups.com", pardot_id: 1},
      {email: "becky@rollups.com", pardot_id: 2}
    ]
    PardotV2.stubs(:retrieve_new_ids).once.yields(new_mappings)

    ContactRollupsPardotMemory.add_and_update_pardot_ids

    new_mappings.each do |mapping|
      refute_nil ContactRollupsPardotMemory.
        where(email: mapping[:email], pardot_id: mapping[:pardot_id]).
        where.not(pardot_id_updated_at: nil).
        first
    end
  end

  test 'add_and_update_pardot_ids updates existing mappings' do
    assert_equal 0, ContactRollupsPardotMemory.count

    email = 'test@domain.com'
    base_time = Time.now.utc - 1.day
    create :contact_rollups_pardot_memory,
      email: email,
      pardot_id: 1,
      pardot_id_updated_at: base_time

    new_pardot_id = 2
    PardotV2.stubs(:retrieve_new_ids).
      once.
      yields([{email: email, pardot_id: new_pardot_id}])

    ContactRollupsPardotMemory.add_and_update_pardot_ids

    refute_nil ContactRollupsPardotMemory.
      where(email: email, pardot_id: new_pardot_id).
      where("pardot_id_updated_at > ?", base_time).
      first
  end

  test 'query_new_contacts' do
    assert_equal 0, ContactRollupsPardotMemory.count
    assert_equal 0, ContactRollupsProcessed.count

    pardot_memory_records = [
      {email: 'alpha', pardot_id: nil},
      {email: 'beta', pardot_id: 1}
    ]
    pardot_memory_records.each {|record| create :contact_rollups_pardot_memory, record}

    processed_contact_records = [
      {email: 'alpha'}, {email: 'beta'}, {email: 'gamma'}
    ]
    processed_contact_records.each {|record| create :contact_rollups_processed, record}

    # Execute SQL query
    results = ActiveRecord::Base.connection.
      exec_query(ContactRollupsPardotMemory.query_new_contacts).map do |record|
      record['email']
    end

    # Should find only 2 new contacts
    assert_equal %w(alpha gamma), results
  end

  test 'create_new_pardot_prospects' do
    assert_equal 0, ContactRollupsPardotMemory.count
    contact = create :contact_rollups_processed, data: {'opt_in' => true}

    PardotV2.expects(:submit_batch_request).once.returns([])

    ContactRollupsPardotMemory.create_new_pardot_prospects

    assert_equal 1, ContactRollupsPardotMemory.count
    record = ContactRollupsPardotMemory.find_by(email: contact.email)
    assert_equal({'db_Opt_In' => 'Yes'}, record&.data_synced)
  end

  test 'query_updated_contacts' do
    assert_equal 0, ContactRollupsPardotMemory.count
    assert_equal 0, ContactRollupsProcessed.count

    base_time = Time.now.utc - 2.days
    pardot_memory_records = [
      {email: 'alpha', pardot_id: 1, data_synced_at: nil, data_synced: nil},
      {
        email: 'beta',
        pardot_id: 2, pardot_id_updated_at: base_time - 2.days,
        data_synced_at: base_time - 1.day, data_synced: {db_Opt_In: 'Yes'}
      },
      {
        email: 'gamma',
        pardot_id: 3, pardot_id_updated_at: base_time + 2.days,
        data_synced_at: base_time + 1.day, data_synced: {db_Opt_In: 'Yes'}
      },
      # dummy records
      {email: 'delta', pardot_id: nil},
      {email: 'epsilon', pardot_id: 4},
    ]
    pardot_memory_records.each {|record| create :contact_rollups_pardot_memory, record}

    # 3 cases that require updating contacts
    processed_contact_records = [
      # Case 1: data_synced_at is null
      {email: 'alpha', data: {opt_in: false}, data_updated_at: base_time},
      # Case 2: data_updated_at > data_synced_at
      {email: 'beta', data: {opt_in: false}, data_updated_at: base_time},
      # Case 3: pardot_id_updated_at > data_synced_at
      {email: 'gamma', data: {opt_in: true}, data_updated_at: base_time},
      # dummy records
      {email: 'delta'},
      {email: 'zeta'},
    ]
    processed_contact_records.each {|record| create :contact_rollups_processed, record}

    # Execute SQL query
    results = ActiveRecord::Base.connection.
      exec_query(ContactRollupsPardotMemory.query_updated_contacts).map do |record|
      record.slice('email', 'pardot_id_changed')
    end

    expected_results = [
      {'email' => 'alpha', 'pardot_id_changed' => nil},
      {'email' => 'beta', 'pardot_id_changed' => 0},
      {'email' => 'gamma', 'pardot_id_changed' => 1}
    ]
    assert_equal expected_results, results
  end

  test 'update_pardot_prospects' do
    email = 'test@domain.com'
    last_sync_time = Time.now.utc - 7.days
    create :contact_rollups_pardot_memory, email: email, data_synced: {db_Opt_In: 'No'}, data_synced_at: last_sync_time
    create :contact_rollups_processed, email: email, data: {'opt_in' => true}

    PardotV2.expects(:submit_batch_request).once.returns([])

    ContactRollupsPardotMemory.update_pardot_prospects

    record = ContactRollupsPardotMemory.find_by(email: email)
    assert_equal({'db_Opt_In' => 'Yes'}, record&.data_synced)
    assert last_sync_time < record&.data_synced_at
  end

  test 'save_sync_results new prospect' do
    assert_equal 0, ContactRollupsPardotMemory.count

    submission = {email: 'valid@domain.com', db_Opt_In: 'Yes'}
    submitted_time = Time.now.utc

    ContactRollupsPardotMemory.save_sync_results [submission], [], submitted_time

    record = ContactRollupsPardotMemory.find_by(
      email: submission[:email],
      data_synced_at: submitted_time
    )
    expected_data_synced = submission.except(:email, :id).deep_stringify_keys
    assert_equal expected_data_synced, record&.data_synced
  end

  test 'save_sync_results updated prospects' do
    assert_equal 0, ContactRollupsPardotMemory.count
    pardot_memory_records = [
      {email: 'alpha', pardot_id: 1, data_synced: nil},
      {email: 'beta', pardot_id: 2, data_synced: {db_Opt_In: 'No'}},
      {email: 'gamma', pardot_id: 3, data_synced: {db_Opt_In: 'Yes'}},
    ]
    pardot_memory_records.each {|record| create :contact_rollups_pardot_memory, record}

    submissions = [
      {email: 'alpha', id: 1, db_Opt_In: 'Yes'},
      {email: 'beta', id: 2, db_Opt_In: 'Yes'},
      {email: 'gamma', id: 3, db_Opt_In: 'Yes'},
    ]
    submitted_time = Time.now.utc

    ContactRollupsPardotMemory.save_sync_results submissions, [], submitted_time

    submissions.each do |submission|
      record = ContactRollupsPardotMemory.find_by(
        email: submission[:email],
        data_synced_at: submitted_time
      )
      expected_data_synced = submission.except(:email, :id).deep_stringify_keys
      assert_equal expected_data_synced, record&.data_synced
    end
  end

  test 'save_sync_results rejected contact' do
    assert_equal 0, ContactRollupsPardotMemory.count

    submission = {email: 'invalid_email', id: nil, db_Opt_In: 'No'}
    errors = [{prospect_index: 0, error_msg: PardotHelpers::ERROR_INVALID_EMAIL}]
    submitted_time = Time.now.utc

    ContactRollupsPardotMemory.save_sync_results [submission], errors, submitted_time

    refute_nil ContactRollupsPardotMemory.find_by(
      email: submission[:email],
      data_rejected_reason: PardotHelpers::ERROR_INVALID_EMAIL,
      data_rejected_at: submitted_time
    )
  end
end
