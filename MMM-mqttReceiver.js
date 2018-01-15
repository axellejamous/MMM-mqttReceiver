'use strict';
/* global Module */

/* Magic Mirror
 * Module: MMM-mqttReceiver
 * Fully based on MMM-mqtt
 * 
 * By Javier Ayala http://www.javierayala.com/
 * MIT Licensed.
 */

Module.register('MMM-mqttReceiver', {

  //mqtt://test.mosquitto.org can be used as a test server
  //'mqtt://172.20.10.3' // PI = mqtt server for IOT
  defaults: {
    mqttServer: 'mqtt://192.168.0.184', //1.10
    mode: 'receive',    
    topic: 'mm/reply', // sub topic - for pub topics look below
    interval: 300000,				
    postText: '',
    loadingText: 'loading MQTT..',
    showTitle: false,
    title: 'MQTT Data'    
  },

  start: function() {
    Log.info('Starting module: ' + this.name);
    this.loaded = false;
    this.mqttVal = '';
    this.updateMqtt(this);
  },

  updateMqtt: function(self) {
    self.sendSocketNotification('MQTT_SERVER_RECEIVER', { mqttServer: self.config.mqttServer, topic: self.config.topic, mode: self.config.mode });
    setTimeout(self.updateMqtt, self.config.interval, self);
  },

  getDom: function() {
    var wrapper = document.createElement('div');

    if (!this.loaded) {
      wrapper.innerHTML = this.config.loadingText;
      return wrapper;
    }

    if (this.config.showTitle) {
      var titleDiv = document.createElement('div');
      titleDiv.innerHTML = this.config.title;
      wrapper.appendChild(titleDiv);
    }

    var mqttDiv = document.createElement('div');
    mqttDiv.innerHTML = this.mqttVal.toString().concat(this.config.postText);
    wrapper.appendChild(mqttDiv);

    return wrapper;
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === 'MQTT_DATA_RECEIVER' && payload.topic === this.config.topic) {
      //console.log("mode: ",this.config.mode);
      this.mqttVal = payload.data.toString();
      this.loaded = true;
      this.updateDom();
    }

    // SET ALARM
    if (notification === 'MQTT_DATA_RECEIVER' && payload.topic === 'alarm/set') {
      //console.log("mode: ",this.config.mode);
      this.sendNotification('SET_ALARM', payload.data);
    }

    if (notification === 'ERROR') {
      this.sendNotification('SHOW_ALERT', payload);
    }
  },

  notificationReceived: function(notification, payload, sender) {
    var self = this;

    if (self.config.mode !== "send") {
      return;
    }

    var topic;
    if (sender) {
      Log.log(this.name + " received a module notification: " + notification + " from sender: " + sender.name + ": ", payload);
    } else {
      Log.log(this.name + " received a system notification: " + notification + ": ", payload);
    }
    topic = this.config.topic;
  }
});
