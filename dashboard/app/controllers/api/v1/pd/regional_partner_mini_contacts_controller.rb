class Api::V1::Pd::RegionalPartnerMiniContactsController < Api::V1::Pd::FormsController
  def new_form
    @contact_form = ::Pd::RegionalPartnerMiniContact.new
  end
end
