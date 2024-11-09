const mongoose=require("mongoose")

const EventSchema=mongoose.Schema({
    name:{type:String,default:''},
    image_url:{type:String,default:''},
    url:{type:String,default:''},
    order: Number
})

const EVENT_SCHEMA = mongoose.model('EVENT_SCHEMA', EventSchema);

module.exports = EVENT_SCHEMA;