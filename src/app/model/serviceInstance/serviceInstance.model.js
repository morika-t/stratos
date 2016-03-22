(function () {
  'use strict';

  /**
   * @namespace app.model.serviceInstance
   * @memberOf app.model
   * @name serviceInstance
   * @description Service instance model
   */
  angular
    .module('app.model')
    .run(registerServiceInstanceModel);

  registerServiceInstanceModel.$inject = [
    'app.api.apiManager',
    'app.model.modelManager'
  ];

  function registerServiceInstanceModel(apiManager, modelManager) {
    modelManager.register('app.model.serviceInstance', new ServiceInstance(apiManager, modelManager));
  }

  /**
   * @namespace app.model.serviceInstance.ServiceInstance
   * @memberof app.model.serviceInstance
   * @name app.model.serviceInstance.ServiceInstance
   * @param {app.api.apiManager} apiManager - the application API manager
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {app.model.account} account - the account model
   * @property {app.api.serviceInstance} serviceInstanceApi - the service instance API
   * @property {array} serviceInstances - the service instances available to user
   * @property {number} numRegistered - the number of user registered service instances
   * @class
   */
  function ServiceInstance(apiManager, modelManager) {
    this.apiManager = apiManager;
    this.account = modelManager.retrieve('app.model.account');
    this.serviceInstanceApi = this.apiManager.retrieve('app.api.serviceInstance');
    this.serviceInstances = [];
    this.numRegistered = 0;
  }

  angular.extend(ServiceInstance.prototype, {
    /**
     * @function connect
     * @memberof app.api.serviceInstance.ServiceInstance
     * @description Connect a service instance
     * @param {object} serviceInstance - the service instance data
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    connect: function (serviceInstance) {
      return this.serviceInstanceApi.connect(this.account.data.username,
                                             serviceInstance.name,
                                             serviceInstance.service_user,
                                             serviceInstance.service_token,
                                             serviceInstance.expires_at,
                                             serviceInstance.scope);
    },

    /**
     * @function disconnect
     * @memberof app.model.serviceInstance.ServiceInstance
     * @description Disconnect user from service instance
     * @param {string} serviceInstanceName - the service instance name
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    disconnect: function (serviceInstanceName) {
      return this.serviceInstanceApi.disconnect(this.account.data.username,
                                                serviceInstanceName);
    },

    /**
     * @function list
     * @memberof app.model.serviceInstance.ServiceInstance
     * @description Returns services instances and number registered
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    list: function () {
      var that = this;
      return this.serviceInstanceApi.list(that.account.data.username)
        .then(function (response) {
          var items = response.data.items;

          // check token expirations
          var now = (new Date()).getTime() / 1000;
          angular.forEach(items, function (item) {
            if (!_.isNil(item.expires_at)) {
              if (item.expires_at > now) {
                item.valid = true;
              } else {
                item.valid = false;
              }
            }
          });

          that.serviceInstances.length = 0;
          that.serviceInstances.push.apply(that.serviceInstances, _.sortBy(items, 'name'));
          that.numRegistered = _.sumBy(items, function (o) { return o.valid ? 1 : 0; }) || 0;
          var numCompleted = _.sumBy(items, function (o) { return o.registered ? 1 : 0; }) || 0;

          return {
            serviceInstances: that.serviceInstances,
            numCompleted: numCompleted,
            numRegistered: that.numRegistered
          };
        });
    },

    /**
     * @function register
     * @memberof app.model.serviceInstance.ServiceInstance
     * @description Set the service instances as registered
     * @param {string} serviceInstanceNames - the service instance names
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    register: function (serviceInstanceNames) {
      return this.serviceInstanceApi.register(this.account.data.username, serviceInstanceNames);
    }
  });

})();