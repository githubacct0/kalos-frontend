// source: maintenance_question.proto
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

goog.exportSymbol('proto.MaintenanceQuestion', null, global);
goog.exportSymbol('proto.MaintenanceQuestionList', null, global);
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
proto.MaintenanceQuestion = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.MaintenanceQuestion.repeatedFields_, null);
};
goog.inherits(proto.MaintenanceQuestion, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.MaintenanceQuestion.displayName = 'proto.MaintenanceQuestion';
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
proto.MaintenanceQuestionList = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.MaintenanceQuestionList.repeatedFields_, null);
};
goog.inherits(proto.MaintenanceQuestionList, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.MaintenanceQuestionList.displayName = 'proto.MaintenanceQuestionList';
}

/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.MaintenanceQuestion.repeatedFields_ = [21];



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
proto.MaintenanceQuestion.prototype.toObject = function(opt_includeInstance) {
  return proto.MaintenanceQuestion.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.MaintenanceQuestion} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.MaintenanceQuestion.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, 0),
    tstatBrand: jspb.Message.getFieldWithDefault(msg, 2, ""),
    thermostat: jspb.Message.getFieldWithDefault(msg, 3, 0),
    plateform: jspb.Message.getFieldWithDefault(msg, 4, 0),
    floatSwitch: jspb.Message.getFieldWithDefault(msg, 5, 0),
    evaporatorCoil: jspb.Message.getFieldWithDefault(msg, 6, 0),
    condenserCoil: jspb.Message.getFieldWithDefault(msg, 7, 0),
    hurricanePad: jspb.Message.getFieldWithDefault(msg, 8, 0),
    lineset: jspb.Message.getFieldWithDefault(msg, 9, 0),
    drainLine: jspb.Message.getFieldWithDefault(msg, 10, 0),
    gasType: jspb.Message.getFieldWithDefault(msg, 11, 0),
    burner: jspb.Message.getFieldWithDefault(msg, 12, 0),
    heatExchanger: jspb.Message.getFieldWithDefault(msg, 13, 0),
    conditionNotes1: jspb.Message.getFieldWithDefault(msg, 14, ""),
    conditionNotes2: jspb.Message.getFieldWithDefault(msg, 15, ""),
    conditionNotes3: jspb.Message.getFieldWithDefault(msg, 16, ""),
    conditionRating1: jspb.Message.getFieldWithDefault(msg, 17, ""),
    conditionRating2: jspb.Message.getFieldWithDefault(msg, 18, ""),
    conditionRating3: jspb.Message.getFieldWithDefault(msg, 19, ""),
    readingId: jspb.Message.getFieldWithDefault(msg, 20, 0),
    fieldMaskList: (f = jspb.Message.getRepeatedField(msg, 21)) == null ? undefined : f,
    pageNumber: jspb.Message.getFieldWithDefault(msg, 22, 0)
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
 * @return {!proto.MaintenanceQuestion}
 */
proto.MaintenanceQuestion.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.MaintenanceQuestion;
  return proto.MaintenanceQuestion.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.MaintenanceQuestion} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.MaintenanceQuestion}
 */
proto.MaintenanceQuestion.deserializeBinaryFromReader = function(msg, reader) {
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
      msg.setTstatBrand(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setThermostat(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setPlateform(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setFloatSwitch(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setEvaporatorCoil(value);
      break;
    case 7:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setCondenserCoil(value);
      break;
    case 8:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setHurricanePad(value);
      break;
    case 9:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setLineset(value);
      break;
    case 10:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setDrainLine(value);
      break;
    case 11:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setGasType(value);
      break;
    case 12:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setBurner(value);
      break;
    case 13:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setHeatExchanger(value);
      break;
    case 14:
      var value = /** @type {string} */ (reader.readString());
      msg.setConditionNotes1(value);
      break;
    case 15:
      var value = /** @type {string} */ (reader.readString());
      msg.setConditionNotes2(value);
      break;
    case 16:
      var value = /** @type {string} */ (reader.readString());
      msg.setConditionNotes3(value);
      break;
    case 17:
      var value = /** @type {string} */ (reader.readString());
      msg.setConditionRating1(value);
      break;
    case 18:
      var value = /** @type {string} */ (reader.readString());
      msg.setConditionRating2(value);
      break;
    case 19:
      var value = /** @type {string} */ (reader.readString());
      msg.setConditionRating3(value);
      break;
    case 20:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setReadingId(value);
      break;
    case 21:
      var value = /** @type {string} */ (reader.readString());
      msg.addFieldMask(value);
      break;
    case 22:
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
proto.MaintenanceQuestion.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.MaintenanceQuestion.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.MaintenanceQuestion} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.MaintenanceQuestion.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f !== 0) {
    writer.writeInt32(
      1,
      f
    );
  }
  f = message.getTstatBrand();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getThermostat();
  if (f !== 0) {
    writer.writeInt32(
      3,
      f
    );
  }
  f = message.getPlateform();
  if (f !== 0) {
    writer.writeInt32(
      4,
      f
    );
  }
  f = message.getFloatSwitch();
  if (f !== 0) {
    writer.writeInt32(
      5,
      f
    );
  }
  f = message.getEvaporatorCoil();
  if (f !== 0) {
    writer.writeInt32(
      6,
      f
    );
  }
  f = message.getCondenserCoil();
  if (f !== 0) {
    writer.writeInt32(
      7,
      f
    );
  }
  f = message.getHurricanePad();
  if (f !== 0) {
    writer.writeInt32(
      8,
      f
    );
  }
  f = message.getLineset();
  if (f !== 0) {
    writer.writeInt32(
      9,
      f
    );
  }
  f = message.getDrainLine();
  if (f !== 0) {
    writer.writeInt32(
      10,
      f
    );
  }
  f = message.getGasType();
  if (f !== 0) {
    writer.writeInt32(
      11,
      f
    );
  }
  f = message.getBurner();
  if (f !== 0) {
    writer.writeInt32(
      12,
      f
    );
  }
  f = message.getHeatExchanger();
  if (f !== 0) {
    writer.writeInt32(
      13,
      f
    );
  }
  f = message.getConditionNotes1();
  if (f.length > 0) {
    writer.writeString(
      14,
      f
    );
  }
  f = message.getConditionNotes2();
  if (f.length > 0) {
    writer.writeString(
      15,
      f
    );
  }
  f = message.getConditionNotes3();
  if (f.length > 0) {
    writer.writeString(
      16,
      f
    );
  }
  f = message.getConditionRating1();
  if (f.length > 0) {
    writer.writeString(
      17,
      f
    );
  }
  f = message.getConditionRating2();
  if (f.length > 0) {
    writer.writeString(
      18,
      f
    );
  }
  f = message.getConditionRating3();
  if (f.length > 0) {
    writer.writeString(
      19,
      f
    );
  }
  f = message.getReadingId();
  if (f !== 0) {
    writer.writeInt32(
      20,
      f
    );
  }
  f = message.getFieldMaskList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      21,
      f
    );
  }
  f = message.getPageNumber();
  if (f !== 0) {
    writer.writeInt32(
      22,
      f
    );
  }
};


/**
 * optional int32 id = 1;
 * @return {number}
 */
proto.MaintenanceQuestion.prototype.getId = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.setId = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string tstat_brand = 2;
 * @return {string}
 */
proto.MaintenanceQuestion.prototype.getTstatBrand = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.setTstatBrand = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional int32 thermostat = 3;
 * @return {number}
 */
proto.MaintenanceQuestion.prototype.getThermostat = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.setThermostat = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional int32 plateform = 4;
 * @return {number}
 */
proto.MaintenanceQuestion.prototype.getPlateform = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.setPlateform = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional int32 float_switch = 5;
 * @return {number}
 */
proto.MaintenanceQuestion.prototype.getFloatSwitch = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/**
 * @param {number} value
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.setFloatSwitch = function(value) {
  return jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional int32 evaporator_coil = 6;
 * @return {number}
 */
proto.MaintenanceQuestion.prototype.getEvaporatorCoil = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/**
 * @param {number} value
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.setEvaporatorCoil = function(value) {
  return jspb.Message.setProto3IntField(this, 6, value);
};


/**
 * optional int32 condenser_coil = 7;
 * @return {number}
 */
proto.MaintenanceQuestion.prototype.getCondenserCoil = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 7, 0));
};


/**
 * @param {number} value
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.setCondenserCoil = function(value) {
  return jspb.Message.setProto3IntField(this, 7, value);
};


/**
 * optional int32 hurricane_pad = 8;
 * @return {number}
 */
proto.MaintenanceQuestion.prototype.getHurricanePad = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 8, 0));
};


/**
 * @param {number} value
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.setHurricanePad = function(value) {
  return jspb.Message.setProto3IntField(this, 8, value);
};


/**
 * optional int32 lineset = 9;
 * @return {number}
 */
proto.MaintenanceQuestion.prototype.getLineset = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 9, 0));
};


/**
 * @param {number} value
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.setLineset = function(value) {
  return jspb.Message.setProto3IntField(this, 9, value);
};


/**
 * optional int32 drain_line = 10;
 * @return {number}
 */
proto.MaintenanceQuestion.prototype.getDrainLine = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 10, 0));
};


/**
 * @param {number} value
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.setDrainLine = function(value) {
  return jspb.Message.setProto3IntField(this, 10, value);
};


/**
 * optional int32 gas_type = 11;
 * @return {number}
 */
proto.MaintenanceQuestion.prototype.getGasType = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 11, 0));
};


/**
 * @param {number} value
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.setGasType = function(value) {
  return jspb.Message.setProto3IntField(this, 11, value);
};


/**
 * optional int32 burner = 12;
 * @return {number}
 */
proto.MaintenanceQuestion.prototype.getBurner = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 12, 0));
};


/**
 * @param {number} value
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.setBurner = function(value) {
  return jspb.Message.setProto3IntField(this, 12, value);
};


/**
 * optional int32 heat_exchanger = 13;
 * @return {number}
 */
proto.MaintenanceQuestion.prototype.getHeatExchanger = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 13, 0));
};


/**
 * @param {number} value
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.setHeatExchanger = function(value) {
  return jspb.Message.setProto3IntField(this, 13, value);
};


/**
 * optional string condition_notes1 = 14;
 * @return {string}
 */
proto.MaintenanceQuestion.prototype.getConditionNotes1 = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 14, ""));
};


/**
 * @param {string} value
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.setConditionNotes1 = function(value) {
  return jspb.Message.setProto3StringField(this, 14, value);
};


/**
 * optional string condition_notes2 = 15;
 * @return {string}
 */
proto.MaintenanceQuestion.prototype.getConditionNotes2 = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 15, ""));
};


/**
 * @param {string} value
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.setConditionNotes2 = function(value) {
  return jspb.Message.setProto3StringField(this, 15, value);
};


/**
 * optional string condition_notes3 = 16;
 * @return {string}
 */
proto.MaintenanceQuestion.prototype.getConditionNotes3 = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 16, ""));
};


/**
 * @param {string} value
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.setConditionNotes3 = function(value) {
  return jspb.Message.setProto3StringField(this, 16, value);
};


/**
 * optional string condition_rating1 = 17;
 * @return {string}
 */
proto.MaintenanceQuestion.prototype.getConditionRating1 = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 17, ""));
};


/**
 * @param {string} value
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.setConditionRating1 = function(value) {
  return jspb.Message.setProto3StringField(this, 17, value);
};


/**
 * optional string condition_rating2 = 18;
 * @return {string}
 */
proto.MaintenanceQuestion.prototype.getConditionRating2 = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 18, ""));
};


/**
 * @param {string} value
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.setConditionRating2 = function(value) {
  return jspb.Message.setProto3StringField(this, 18, value);
};


/**
 * optional string condition_rating3 = 19;
 * @return {string}
 */
proto.MaintenanceQuestion.prototype.getConditionRating3 = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 19, ""));
};


/**
 * @param {string} value
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.setConditionRating3 = function(value) {
  return jspb.Message.setProto3StringField(this, 19, value);
};


/**
 * optional int32 reading_id = 20;
 * @return {number}
 */
proto.MaintenanceQuestion.prototype.getReadingId = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 20, 0));
};


/**
 * @param {number} value
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.setReadingId = function(value) {
  return jspb.Message.setProto3IntField(this, 20, value);
};


/**
 * repeated string field_mask = 21;
 * @return {!Array<string>}
 */
proto.MaintenanceQuestion.prototype.getFieldMaskList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 21));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.setFieldMaskList = function(value) {
  return jspb.Message.setField(this, 21, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.addFieldMask = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 21, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.clearFieldMaskList = function() {
  return this.setFieldMaskList([]);
};


/**
 * optional int32 page_number = 22;
 * @return {number}
 */
proto.MaintenanceQuestion.prototype.getPageNumber = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 22, 0));
};


/**
 * @param {number} value
 * @return {!proto.MaintenanceQuestion} returns this
 */
proto.MaintenanceQuestion.prototype.setPageNumber = function(value) {
  return jspb.Message.setProto3IntField(this, 22, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.MaintenanceQuestionList.repeatedFields_ = [1];



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
proto.MaintenanceQuestionList.prototype.toObject = function(opt_includeInstance) {
  return proto.MaintenanceQuestionList.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.MaintenanceQuestionList} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.MaintenanceQuestionList.toObject = function(includeInstance, msg) {
  var f, obj = {
    resultsList: jspb.Message.toObjectList(msg.getResultsList(),
    proto.MaintenanceQuestion.toObject, includeInstance),
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
 * @return {!proto.MaintenanceQuestionList}
 */
proto.MaintenanceQuestionList.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.MaintenanceQuestionList;
  return proto.MaintenanceQuestionList.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.MaintenanceQuestionList} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.MaintenanceQuestionList}
 */
proto.MaintenanceQuestionList.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.MaintenanceQuestion;
      reader.readMessage(value,proto.MaintenanceQuestion.deserializeBinaryFromReader);
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
proto.MaintenanceQuestionList.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.MaintenanceQuestionList.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.MaintenanceQuestionList} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.MaintenanceQuestionList.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getResultsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.MaintenanceQuestion.serializeBinaryToWriter
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
 * repeated MaintenanceQuestion results = 1;
 * @return {!Array<!proto.MaintenanceQuestion>}
 */
proto.MaintenanceQuestionList.prototype.getResultsList = function() {
  return /** @type{!Array<!proto.MaintenanceQuestion>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.MaintenanceQuestion, 1));
};


/**
 * @param {!Array<!proto.MaintenanceQuestion>} value
 * @return {!proto.MaintenanceQuestionList} returns this
*/
proto.MaintenanceQuestionList.prototype.setResultsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.MaintenanceQuestion=} opt_value
 * @param {number=} opt_index
 * @return {!proto.MaintenanceQuestion}
 */
proto.MaintenanceQuestionList.prototype.addResults = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.MaintenanceQuestion, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.MaintenanceQuestionList} returns this
 */
proto.MaintenanceQuestionList.prototype.clearResultsList = function() {
  return this.setResultsList([]);
};


/**
 * optional int32 total_count = 2;
 * @return {number}
 */
proto.MaintenanceQuestionList.prototype.getTotalCount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.MaintenanceQuestionList} returns this
 */
proto.MaintenanceQuestionList.prototype.setTotalCount = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


goog.object.extend(exports, proto);