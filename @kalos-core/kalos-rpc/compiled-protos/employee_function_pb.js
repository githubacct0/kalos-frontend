// source: employee_function.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

var jspb = require('google-protobuf');
var goog = jspb;
var global = Function('return this')();

goog.exportSymbol('proto.EmployeeFunction', null, global);
goog.exportSymbol('proto.EmployeeFunctionList', null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.EmployeeFunction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.EmployeeFunction.repeatedFields_, null);
};
goog.inherits(proto.EmployeeFunction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.EmployeeFunction.displayName = 'proto.EmployeeFunction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.EmployeeFunctionList = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.EmployeeFunctionList.repeatedFields_, null);
};
goog.inherits(proto.EmployeeFunctionList, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.EmployeeFunctionList.displayName = 'proto.EmployeeFunctionList';
}

/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.EmployeeFunction.repeatedFields_ = [10];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.EmployeeFunction.prototype.toObject = function(opt_includeInstance) {
  return proto.EmployeeFunction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.EmployeeFunction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.EmployeeFunction.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, 0),
    name: jspb.Message.getFieldWithDefault(msg, 2, ""),
    color: jspb.Message.getFieldWithDefault(msg, 3, ""),
    status: jspb.Message.getFieldWithDefault(msg, 4, 0),
    isdeleted: jspb.Message.getFieldWithDefault(msg, 5, 0),
    addeddate: jspb.Message.getFieldWithDefault(msg, 6, ""),
    modifydate: jspb.Message.getFieldWithDefault(msg, 7, ""),
    addeduserid: jspb.Message.getFieldWithDefault(msg, 8, 0),
    modifyuserid: jspb.Message.getFieldWithDefault(msg, 9, 0),
    fieldMaskList: (f = jspb.Message.getRepeatedField(msg, 10)) == null ? undefined : f,
    pageNumber: jspb.Message.getFieldWithDefault(msg, 11, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.EmployeeFunction}
 */
proto.EmployeeFunction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.EmployeeFunction;
  return proto.EmployeeFunction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.EmployeeFunction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.EmployeeFunction}
 */
proto.EmployeeFunction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setColor(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setStatus(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setIsdeleted(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setAddeddate(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setModifydate(value);
      break;
    case 8:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setAddeduserid(value);
      break;
    case 9:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setModifyuserid(value);
      break;
    case 10:
      var value = /** @type {string} */ (reader.readString());
      msg.addFieldMask(value);
      break;
    case 11:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setPageNumber(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.EmployeeFunction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.EmployeeFunction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.EmployeeFunction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.EmployeeFunction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f !== 0) {
    writer.writeInt32(
      1,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getColor();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getStatus();
  if (f !== 0) {
    writer.writeInt32(
      4,
      f
    );
  }
  f = message.getIsdeleted();
  if (f !== 0) {
    writer.writeInt32(
      5,
      f
    );
  }
  f = message.getAddeddate();
  if (f.length > 0) {
    writer.writeString(
      6,
      f
    );
  }
  f = message.getModifydate();
  if (f.length > 0) {
    writer.writeString(
      7,
      f
    );
  }
  f = message.getAddeduserid();
  if (f !== 0) {
    writer.writeInt32(
      8,
      f
    );
  }
  f = message.getModifyuserid();
  if (f !== 0) {
    writer.writeInt32(
      9,
      f
    );
  }
  f = message.getFieldMaskList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      10,
      f
    );
  }
  f = message.getPageNumber();
  if (f !== 0) {
    writer.writeInt32(
      11,
      f
    );
  }
};


/**
 * optional int32 id = 1;
 * @return {number}
 */
proto.EmployeeFunction.prototype.getId = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.EmployeeFunction} returns this
 */
proto.EmployeeFunction.prototype.setId = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string name = 2;
 * @return {string}
 */
proto.EmployeeFunction.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.EmployeeFunction} returns this
 */
proto.EmployeeFunction.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string color = 3;
 * @return {string}
 */
proto.EmployeeFunction.prototype.getColor = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.EmployeeFunction} returns this
 */
proto.EmployeeFunction.prototype.setColor = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional int32 status = 4;
 * @return {number}
 */
proto.EmployeeFunction.prototype.getStatus = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.EmployeeFunction} returns this
 */
proto.EmployeeFunction.prototype.setStatus = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional int32 isdeleted = 5;
 * @return {number}
 */
proto.EmployeeFunction.prototype.getIsdeleted = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/**
 * @param {number} value
 * @return {!proto.EmployeeFunction} returns this
 */
proto.EmployeeFunction.prototype.setIsdeleted = function(value) {
  return jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional string addeddate = 6;
 * @return {string}
 */
proto.EmployeeFunction.prototype.getAddeddate = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.EmployeeFunction} returns this
 */
proto.EmployeeFunction.prototype.setAddeddate = function(value) {
  return jspb.Message.setProto3StringField(this, 6, value);
};


/**
 * optional string modifydate = 7;
 * @return {string}
 */
proto.EmployeeFunction.prototype.getModifydate = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.EmployeeFunction} returns this
 */
proto.EmployeeFunction.prototype.setModifydate = function(value) {
  return jspb.Message.setProto3StringField(this, 7, value);
};


/**
 * optional int32 addeduserid = 8;
 * @return {number}
 */
proto.EmployeeFunction.prototype.getAddeduserid = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 8, 0));
};


/**
 * @param {number} value
 * @return {!proto.EmployeeFunction} returns this
 */
proto.EmployeeFunction.prototype.setAddeduserid = function(value) {
  return jspb.Message.setProto3IntField(this, 8, value);
};


/**
 * optional int32 modifyuserid = 9;
 * @return {number}
 */
proto.EmployeeFunction.prototype.getModifyuserid = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 9, 0));
};


/**
 * @param {number} value
 * @return {!proto.EmployeeFunction} returns this
 */
proto.EmployeeFunction.prototype.setModifyuserid = function(value) {
  return jspb.Message.setProto3IntField(this, 9, value);
};


/**
 * repeated string field_mask = 10;
 * @return {!Array<string>}
 */
proto.EmployeeFunction.prototype.getFieldMaskList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 10));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.EmployeeFunction} returns this
 */
proto.EmployeeFunction.prototype.setFieldMaskList = function(value) {
  return jspb.Message.setField(this, 10, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.EmployeeFunction} returns this
 */
proto.EmployeeFunction.prototype.addFieldMask = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 10, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.EmployeeFunction} returns this
 */
proto.EmployeeFunction.prototype.clearFieldMaskList = function() {
  return this.setFieldMaskList([]);
};


/**
 * optional int32 page_number = 11;
 * @return {number}
 */
proto.EmployeeFunction.prototype.getPageNumber = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 11, 0));
};


/**
 * @param {number} value
 * @return {!proto.EmployeeFunction} returns this
 */
proto.EmployeeFunction.prototype.setPageNumber = function(value) {
  return jspb.Message.setProto3IntField(this, 11, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.EmployeeFunctionList.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.EmployeeFunctionList.prototype.toObject = function(opt_includeInstance) {
  return proto.EmployeeFunctionList.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.EmployeeFunctionList} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.EmployeeFunctionList.toObject = function(includeInstance, msg) {
  var f, obj = {
    resultsList: jspb.Message.toObjectList(msg.getResultsList(),
    proto.EmployeeFunction.toObject, includeInstance),
    totalCount: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.EmployeeFunctionList}
 */
proto.EmployeeFunctionList.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.EmployeeFunctionList;
  return proto.EmployeeFunctionList.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.EmployeeFunctionList} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.EmployeeFunctionList}
 */
proto.EmployeeFunctionList.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.EmployeeFunction;
      reader.readMessage(value,proto.EmployeeFunction.deserializeBinaryFromReader);
      msg.addResults(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setTotalCount(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.EmployeeFunctionList.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.EmployeeFunctionList.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.EmployeeFunctionList} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.EmployeeFunctionList.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getResultsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.EmployeeFunction.serializeBinaryToWriter
    );
  }
  f = message.getTotalCount();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
};


/**
 * repeated EmployeeFunction results = 1;
 * @return {!Array<!proto.EmployeeFunction>}
 */
proto.EmployeeFunctionList.prototype.getResultsList = function() {
  return /** @type{!Array<!proto.EmployeeFunction>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.EmployeeFunction, 1));
};


/**
 * @param {!Array<!proto.EmployeeFunction>} value
 * @return {!proto.EmployeeFunctionList} returns this
*/
proto.EmployeeFunctionList.prototype.setResultsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.EmployeeFunction=} opt_value
 * @param {number=} opt_index
 * @return {!proto.EmployeeFunction}
 */
proto.EmployeeFunctionList.prototype.addResults = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.EmployeeFunction, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.EmployeeFunctionList} returns this
 */
proto.EmployeeFunctionList.prototype.clearResultsList = function() {
  return this.setResultsList([]);
};


/**
 * optional int32 total_count = 2;
 * @return {number}
 */
proto.EmployeeFunctionList.prototype.getTotalCount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.EmployeeFunctionList} returns this
 */
proto.EmployeeFunctionList.prototype.setTotalCount = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


goog.object.extend(exports, proto);
