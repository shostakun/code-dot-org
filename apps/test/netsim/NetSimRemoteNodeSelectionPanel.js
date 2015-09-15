/** @file Tests for NetSimRemoteNodeSelectionPanel */
/* global $, describe, beforeEach, it */
var testUtils = require('../util/testUtils');
var NetSimTestUtils = require('../util/netsimTestUtils');
var assert = testUtils.assert;

var NetSimRemoteNodeSelectionPanel = require('@cdo/apps/netsim/NetSimRemoteNodeSelectionPanel');
var NetSimClientNode = require('@cdo/apps/netsim/NetSimClientNode');
var NetSimGlobals = require('@cdo/apps/netsim/NetSimGlobals');
var NetSimRouterNode = require('@cdo/apps/netsim/NetSimRouterNode');
var DashboardUser = require('@cdo/apps/netsim/DashboardUser');

describe("NetSimRemoteNodeSelectionPanel", function () {
  var rootDiv, emptyCallbacks;

  function makeRouters(routerCount) {
    var nodes = [];
    for (var i = 0; i < routerCount; i++) {
      nodes.push(new NetSimRouterNode());
    }
    return nodes;
  }

  function makeClients(routerCount) {
    var nodes = [];
    for (var i = 0; i < routerCount; i++) {
      nodes.push(new NetSimClientNode());
    }
    return nodes;
  }

  function panelWithNodes(clients) {
    return new NetSimRemoteNodeSelectionPanel(rootDiv, {
      nodesOnShard: clients,
      incomingConnectionNodes: []
    }, emptyCallbacks);
  }

  beforeEach(function () {
    NetSimTestUtils.initializeGlobalsToDefaultValues();
    rootDiv = $(document.createElement('div'));
    emptyCallbacks = {
      addRouterCallback: function () {},
      cancelButtonCallback: function () {},
      joinButtonCallback: function () {},
      resetShardCallback: function () {}
    };
  });

  describe("canAddRouter", function () {
    var MAX_ROUTERS;

    beforeEach(function () {
      NetSimGlobals.getLevelConfig().showAddRouterButton = true;
      MAX_ROUTERS = NetSimGlobals.getMaxRouters();
    });

    it ("true in empty shard (with default test setup)", function () {
      var panel = panelWithNodes([]);
      assert(panel.canAddRouter());
    });

    it ("false if level.showAddRouterButton is false", function () {
      NetSimGlobals.getLevelConfig().showAddRouterButton = false;
      var panel = panelWithNodes([]);
      assert(!panel.canAddRouter());
    });

    it ("false with an outgoing connection request", function () {
      var nodes = makeClients(3);
      var panel = new NetSimRemoteNodeSelectionPanel(rootDiv, {
        nodesOnShard: nodes,
        remoteNode: nodes[0],
        incomingConnectionNodes: []
      }, emptyCallbacks);
      assert(!panel.canAddRouter());
    });

    it ("true if current router count is below the strict limit", function () {
      var panel = panelWithNodes(makeRouters(MAX_ROUTERS - 1));
      assert(panel.canAddRouter());
    });

    it ("false if current router count is at/beyond the strict limit", function () {
      var panel = panelWithNodes(makeRouters(MAX_ROUTERS));
      assert(!panel.canAddRouter());
    });

    it ("true if current client count is at/beyond the strict router limit", function () {
      var panel = panelWithNodes(makeClients(MAX_ROUTERS));
      assert(panel.canAddRouter());
    });

  });

  describe("canCurrentUserResetShard", function () {
    var panel;

    beforeEach(function () {
      panel = panelWithNodes([]);
    });

    it ("false if no user detected", function () {
      assert.equal(false, panel.canCurrentUserResetShard());
    });

    describe ("for admin", function () {
      var adminUser;

      beforeEach(function () {
        adminUser = new DashboardUser();
        adminUser.isAdmin = true;
        panel.user_ = adminUser;
      });

      it ("true with no shard ID", function () {
        panel.shardID_ = undefined;
        assert.equal(true, panel.canCurrentUserResetShard());
      });

      it ("true with numeric shard ID", function () {
        panel.shardID_ = 'anyoldshardname_42';
        assert.equal(true, panel.canCurrentUserResetShard());
      });

      it ("true with word shard ID", function () {
        panel.shardID_ = 'anyoldshardname_test';
        assert.equal(true, panel.canCurrentUserResetShard());
      });
    });

    describe ("for teacher", function () {
      var teacherUser;

      beforeEach(function () {
        teacherUser = new DashboardUser();
        teacherUser.isAdmin = false;
        teacherUser.ownedSections = [{id: 42}, {id: 43}];
        panel.user_ = teacherUser;
      });

      it ("true if user owns section", function () {
        panel.shardID_ = 'anyoldshardname_42';
        assert.equal(true, panel.canCurrentUserResetShard());

        panel.shardID_ = 'someothershardname_43';
        assert.equal(true, panel.canCurrentUserResetShard());
      });

      it ("false if user does not own section", function () {
        panel.shardID_ = 'anyoldshardname_44';
        assert.equal(false, panel.canCurrentUserResetShard());

        panel.shardID_ = 'someothershardname_45';
        assert.equal(false, panel.canCurrentUserResetShard());
      });

      it ("false with word (non-section) shard IDs", function () {
        panel.shardID_ = 'customshard_test';
        assert.equal(false, panel.canCurrentUserResetShard());
      });
    });

    describe ("for student", function () {
      var studentUser;

      beforeEach(function () {
        studentUser = new DashboardUser();
        studentUser.isAdmin = false;
        studentUser.ownedSections = [];
        panel.user_ = studentUser;
      });

      it ("false for numeric (section) shard IDs", function () {
        panel.shardID_ = 'anyoldshardname_42';
        assert.equal(false, panel.canCurrentUserResetShard());

        panel.shardID_ = 'someothershardname_43';
        assert.equal(false, panel.canCurrentUserResetShard());

        panel.shardID_ = 'anyoldshardname_44';
        assert.equal(false, panel.canCurrentUserResetShard());

        panel.shardID_ = 'someothershardname_45';
        assert.equal(false, panel.canCurrentUserResetShard());
      });

      it ("false with word (non-section) shard IDs", function () {
        panel.shardID_ = 'customshard_test';
        assert.equal(false, panel.canCurrentUserResetShard());
      });
    });

  });
});
