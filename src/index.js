import '@babel/polyfill'
import './net/index.js'

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1)
}
// "@babel/plugin-proposal-async-generator-functions": "^7.0.0",
// "@babel/plugin-proposal-class-properties": "^7.0.0",
