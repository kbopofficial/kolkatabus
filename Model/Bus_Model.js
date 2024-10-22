const mongoose=require("mongoose")

const Bus_Schema=mongoose.Schema({
    name:String,
    route:String,
    status:String,
    image_url:String,
    stops:[String],
})

const BUS_SCHEMA = mongoose.model('BUS_SCHEMA', Bus_Schema);

module.exports = BUS_SCHEMA;