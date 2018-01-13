'use strict';

/* Magic Mirror
 * Module: MMM-mqttReceiver
 * Fully based on MMM-mqtt
 *
 * By Javier Ayala http://www.javierayala.com/
 * MIT Licensed.
 */

const NodeHelper = require('node_helper');
var mqtt = require('mqtt');

module.exports = NodeHelper.create({
  start: function() {
    console.log('MMM-mqttReceiver started ...');
    this.clients = [];
  },

  connectMqtt: function(config) {
    var self = this;
    var client;

    if(typeof self.clients[config.mqttServer] === "undefined") {
      console.log("Creating new MQTT client for url: ", config.mqttServer);
      client = mqtt.connect(config.mqttServer);
      self.clients[config.mqttServer] = client;

      client.on('error', function(error) {
        console.log('*** MQTT RECEIVER JS ERROR ***: ' + error);
        self.sendSocketNotification('ERROR', {
          type: 'notification',
          title: 'MQTT Receiver Error',
          message: 'The MQTT Client has suffered an error: ' + error
        });
      });

      client.on('offline', function() {
        console.log('*** MQTT Receiver Client Offline ***');
        self.sendSocketNotification('ERROR', {
          type: 'notification',
          title: 'MQTT Offline',
          message: 'MQTT Server is offline.'
        });
        client.end();
      });
    } else {
      client = self.clients[config.mqttServer];
    }

    if(config.mode !== 'send') {
      client.subscribe(config.topic);

      client.on('message', function(topic, message) {
        self.sendSocketNotification('MQTT_DATA_RECEIVER', {'topic':topic, 'data':message.toString()});
      });
    }
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === 'MQTT_SERVER_RECEIVER') {
      this.connectMqtt(payload);
    } else if(notification == 'MQTT_SEND_RECEIVER') {
      var client = this.clients[payload.mqttServer];
      if(typeof client !== "undefined") {
        client.publish(payload.topic, JSON.stringify(payload.payload));
      }
    }
  }
});
