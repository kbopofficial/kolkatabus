require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = process.env.PORT;
const mongoose = require("mongoose")
const ADMIN_SCHEMA = require('./Model/Admin')
const TEAM_SCHEMA = require('./Model/Team_members')
const BUS_SCHEMA = require('./Model/Bus_Model')
const NEWS_SCHEMA = require('./Model/News.js')
const EVENT_SCHEMA = require('./Model/Event.js')
const About_Schema = require('./Model/About.js')
const Help_Schema = require('./Model/Help.js')

const axios = require('axios');
mongoose.connect(process.env.MONGO_URL);
app.use(cors({
    credentials: true,
}));
app.use(bodyParser.json());

// const parseBusRoutes = async (routesData) => {
//     for (const routeString of routesData) {
//         const parts = routeString.split(':');
//         const stopsString = parts[2].substring(0, parts[2].length - 2);
//         const stops = stopsString.split(',').map(s => s.trim());

//         let busData = {
//             name: parts[0].trim(),
//             route: parts[1].substring(0, parts[1].length - 4).trim(),
//             status: parts[3].trim(),
//             image_url: parts[4].trim(),
//             stops: stops,
//             zone:'3'

//         };

//         await BUS_SCHEMA.create(busData);
//     }
// };

// app.get('/read', (req, res) => {
// parseBusRoutes(route2)
// res.json({message:"OK"})
// });


const auth = (req, res, next) => {
    try {

        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({ error: 'Authorization header missing' });
        } else if (authHeader != process.env.SECRET_KEY) {

            return res.status(401).json({ error: 'Incorrect authorization header' });
        }
        next();

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// app.use(auth)

// app.get('/same_image', async (req, res) => {

//     try {
//         // Step 1: Retrieve all buses
//         const buses = await BUS_SCHEMA.find();

//         // Step 2: Group buses by name
//         const busGroups = buses.reduce((acc, bus) => {
//           acc[bus.name] = acc[bus.name] || [];
//           acc[bus.name].push(bus);
//           return acc;
//         }, {});

//         // Step 3: Iterate through each group
//         for (const [name, group] of Object.entries(busGroups)) {
//           // Check if any bus in the group has an image_url
//           const busWithImageUrl = group.find(bus => bus.image_url);

//           if (busWithImageUrl) {
//             const imageUrl = busWithImageUrl.image_url;

//             // Update each bus in the group to have the same image_url
//             // await Promise.all(
//               group.map(async(bus) => {
//                 // Only update if the bus doesn't already have an image_url
//                 // if (!bus.image_url) {
//                   await BUS_SCHEMA.findByIdAndUpdate(bus._id, { image_url: imageUrl });
//                 // }
//               })
//             // );
//           }
//         }

//         res.json("Image URLs updated successfully");
//       } catch (error) {
//         console.error("Error updating image URLs:", error);
//       }

// })

app.get('/all_bus', async (req, res) => {
    try {
        let { zone } = req.query
        const findBus = await BUS_SCHEMA.find({ "zone": zone });
        if (findBus.length === 0) {
            return res.status(404).json({ message: "Bus not found" });
        }

        res.json(findBus);

        //    let baseurl="https://raw.githubusercontent.com/busrepository/busrepo/main/";

        //    const buses = await BUS_SCHEMA.find({ image_url: { $exists: true, $ne: '' } });


        //    for (let bus of buses) {
        //        const updatedImageUrl = baseurl + bus.image_url;
        //        await BUS_SCHEMA.updateOne(
        //            { _id: bus._id }, 
        //            { $set: { image_url: updatedImageUrl } }
        //        );
        //    }

        //         res.json("done")


    } catch (error) {
        console.error("Error finding bus:", error);
        res.status(500).json({ error: "Failed to find bus" });
    }

});

app.post('/add_bus', async (req, res) => {
    const busDetails = req.body;


    // if (!busDetails.name || !busDetails.route || !busDetails.status || !busDetails.stops || !busDetails.image_url) {
    //     return res.status(400).json({ error: "Missing required bus details (name, route, image_url, status, and stops)" });
    // }

    try {
        const newBus = await BUS_SCHEMA.create(busDetails);
        res.status(201).json({ message: true, bus: newBus });
    } catch (error) {
        console.error("Error adding bus:", error);
        res.status(500).json({ error: "Failed to add bus" });
    }
});


app.put('/update_bus', async (req, res) => {
    const { id, ...busDetails } = req.body;
    if (!id) {
        return res.status(400).json({ error: "Bus ID is required" });
    }
    try {
        const updatedBus = await BUS_SCHEMA.findByIdAndUpdate(
            id,
            { $set: busDetails },
            { new: true, runValidators: true }
        );

        if (updatedBus) {
            res.json("Bus Updated");
        } else {
            res.status(404).json({ error: "Bus not found" });
        }
    } catch (error) {
        console.error("Error updating bus:", error);
        res.status(500).json({ error: "Failed to update bus" });
    }
});

app.delete('/delete_bus', async (req, res) => {
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ error: "Bus ID is required" });
    }
    try {
        const deletedBus = await BUS_SCHEMA.findByIdAndDelete(id);

        if (deletedBus) {
            res.json("Bus deleted successfully");
        } else {
            res.status(404).json({ error: "Bus not found" });
        }
    } catch (error) {
        console.error("Error deleting bus:", error);
        res.status(500).json({ error: "Failed to delete bus" });
    }
});


app.get('/via_bus', async (req, res) => {
    const { via } = req.query;
    if (!via) {
        return res.status(400).json({ error: "Via route is required" });
    }

    try {
        const buses = await BUS_SCHEMA.find({
            stops: {
                $elemMatch: { $eq: via }
            }
        });


        // const filteredBuses = buses.filter(bus => {
        //     const index = bus.stops.indexOf(via);
        //     return index > 0 && index < bus.stops.length - 1;
        // });

        if (buses.length > 0) {
            res.json(buses);
        } else {
            res.status(404).json({ error: "No buses found for the given stop, excluding first and last stops" });
        }
    } catch (error) {
        console.error("Error finding buses:", error);
        res.status(500).json({ error: "Failed to retrieve buses" });
    }
});

app.get('/busName', async (req, res) => {
    const { busName } = req.query;
    if (!busName) {
        return res.status(400).json({ error: "Bus Name is required" });
    }
    try {
        const findBus = await BUS_SCHEMA.find({ name: busName });
        if (findBus.length === 0) {
            return res.status(404).json({ message: "Bus not found" });
        }
        res.json(findBus);
    } catch (error) {
        console.error("Error finding bus:", error);
        res.status(500).json({ error: "Failed to find bus" });
    }
});

app.get('/from-to', async (req, res) => {
    const { from, to } = req.query;

    if (!from || !to) {
        return res.status(400).json({ error: "Something is missing, from or to" });
    }
    try {
        const buses = await BUS_SCHEMA.find({
            stops: { $all: [from, to] }
        });
        const filteredBuses = buses.filter(bus => {
            const fromIndex = bus.stops.indexOf(from);
            const toIndex = bus.stops.indexOf(to);
            return fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex;
        });

        res.json(filteredBuses);

    } catch (error) {
        console.error("Error searching for buses:", error);
        res.status(500).json({ error: "Failed to search buses" });
    }
});

app.get('/busId', async (req, res) => {
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ error: "Bus ID is required" });
    }

    try {
        const bus = await BUS_SCHEMA.findById(id)
        res.json(bus);

    } catch (error) {
        console.error("Error searching for buses:", error);
        res.status(500).json({ error: "Failed to search bus" });
    }
});





//FOR Team
app.get('/all_team_members', async (req, res) => {

    try {
        const team = await TEAM_SCHEMA.find()
        res.json(team);

    } catch (error) {
        console.error("Error searching for team members:", error);
        res.status(500).json({ error: "Failed to team members" });
    }
});


app.post('/add_team_member', async (req, res) => {
    const team_member_details = req.body;
    if (!team_member_details.name || !team_member_details.designation || !team_member_details.image_path) {
        return res.status(400).json({ error: "Missing required member details" });
    }
    try {
        const team = await TEAM_SCHEMA.create(team_member_details)

        res.json("New member added successfully");

    } catch (error) {
        console.error("Error searching for team member:", error);
        res.status(500).json({ error: "Failed to add team member" });
    }
});

app.put('/update_team_member', async (req, res) => {
    const { id, ...updateDetails } = req.body;
    if (!id) {
        return res.status(400).json({ error: "Team member ID is required" });
    }

    try {
        //   const up=await TEAM_SCHEMA.updateMany({insta:'',facebook:'',others:''})
        //   res.json("add insta")
        const updatedMember = await TEAM_SCHEMA.findByIdAndUpdate(
            id,
            { $set: updateDetails },
            { new: true, runValidators: true }
        );

        if (updatedMember) {
            res.json({ message: "Team member updated successfully", member: updatedMember });
        } else {
            res.status(404).json({ error: "Team member not found" });
        }
    } catch (error) {
        console.error("Error updating team member:", error);
        res.status(500).json({ error: "Failed to update team member" });
    }
});


app.delete('/delete_team_member', async (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "Team member ID is required" });
    }

    try {

        const deletedMember = await TEAM_SCHEMA.findByIdAndDelete(id);

        if (deletedMember) {
            res.json({ message: "Team member deleted successfully", member: deletedMember });
        } else {
            res.status(404).json({ error: "Team member not found" });
        }
    } catch (error) {
        console.error("Error deleting team member:", error);
        res.status(500).json({ error: "Failed to delete team member" });
    }
});





//FOR ADMIN
app.get('/all_admin', async (req, res) => {

    try {
        const local_admins = await ADMIN_SCHEMA.find()
        if (local_admins.length) {
            res.json(local_admins);
        } else {
            res.json("No admin found ")
        }

    } catch (error) {
        console.error("Error searching for admins:", error);
        res.status(500).json({ error: "Failed to search admins" });
    }
});

app.post('/add_admin', async (req, res) => {
    const adminDetails = req.body;

    if (!adminDetails.name || !adminDetails.designation || !adminDetails.email_id) {
        return res.status(400).json({ error: "Name, designation, and email ID are required" });
    }

    try {
        const newAdmin = await ADMIN_SCHEMA.create(adminDetails);

        res.status(201).json({ message: "Admin added successfully", admin: newAdmin });
    } catch (error) {
        console.error("Error adding admin:", error);
        res.status(500).json({ error: "Failed to add admin" });
    }
});

app.delete('/delete_admin', async (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "Admin ID is required" });
    }

    try {
        const deletedAdmin = await ADMIN_SCHEMA.findByIdAndDelete(id);

        if (deletedAdmin) {
            res.json({ message: "Admin deleted successfully", admin: deletedAdmin });
        } else {
            res.status(404).json({ error: "Admin not found" });
        }
    } catch (error) {
        console.error("Error deleting admin:", error);
        res.status(500).json({ error: "Failed to delete admin" });
    }
});

app.put('/update_admin', async (req, res) => {
    const { id, ...updateDetails } = req.body;

    if (!id) {
        return res.status(400).json({ error: "Admin ID is required" });
    }

    try {
        const updatedAdmin = await ADMIN_SCHEMA.findByIdAndUpdate(
            id,
            { $set: updateDetails },
            { new: true, runValidators: true }
        );

        if (updatedAdmin) {
            res.json({ message: "Admin updated successfully", admin: updatedAdmin });
        } else {
            res.status(404).json({ error: "Admin not found" });
        }
    } catch (error) {
        console.error("Error updating admin:", error);
        res.status(500).json({ error: "Failed to update admin" });
    }
});




//For News
app.get('/all_news', async (req, res) => {
    try {
        let news = await NEWS_SCHEMA.find();
        res.json(news)

    } catch (error) {
        console.error("Error searching news :", error);
        res.status(500).json({ error: "Error searching news" });
    }
});

app.post('/add_news', async (req, res) => {
    const newsDetails = req.body;

    if (!newsDetails.image_url || !newsDetails.url || !newsDetails.news || !newsDetails.order) {
        return res.status(400).json({ error: "Image URL, URL, and news content are required" });
    }

    try {
        const newNews = await NEWS_SCHEMA.create(newsDetails);

        res.status(201).json({ message: "News added successfully", news: newNews });
    } catch (error) {
        console.error("Error adding news:", error);
        res.status(500).json({ error: "Failed to add news" });
    }
});


app.put('/update_news', async (req, res) => {
    const { id, ...updateDetails } = req.body;

    if (!id) {
        return res.status(400).json({ error: "News ID is required" });
    }

    try {
        const updatedNews = await NEWS_SCHEMA.findByIdAndUpdate(
            id,
            { $set: updateDetails },
            { new: true, runValidators: true }
        );

        if (updatedNews) {
            res.json({ message: "News updated successfully", news: updatedNews });
        } else {
            res.status(404).json({ error: "News not found" });
        }
    } catch (error) {
        console.error("Error updating news:", error);
        res.status(500).json({ error: "Failed to update news" });
    }
});


app.delete('/delete_news', async (req, res) => {
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ error: "News ID is required" });
    }
    try {
        const deletedNews = await NEWS_SCHEMA.findByIdAndDelete(id);

        if (deletedNews) {
            res.json({ message: "News deleted successfully", news: deletedNews });
        } else {
            res.status(404).json({ error: "News not found" });
        }
    } catch (error) {
        console.error("Error deleting news:", error);
        res.status(500).json({ error: "Failed to delete news" });
    }
});





//For EVENT
app.get('/event', async (req, res) => {
    try {
        let event = await EVENT_SCHEMA.find();
        if (!event) {
            res.json("No event found")
        }
        res.json(event)

    } catch (error) {
        console.error("Error searching event :", error);
        res.status(500).json({ error: "Error searching event" });
    }
});

app.post('/event', async (req, res) => {
    const { name, url, image_url,order, expiresAt } = req.body;

    if (!name || !url || !image_url) {
        return res.status(400).json({ error: "Name, URL, or image URL are required" });
    }
let expireDate=null;
  if(expiresAt!=null){
expireDate=new Date(expiresAt)
  }
    try {
        const event = await EVENT_SCHEMA.create({
            name,
            image_url,
            url,
            order,
            expiresAt:expireDate
        });

        res.status(201).json({ message: "Event created with expiration timer", event });
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ error: "Failed to create event" });
    }
});




app.put('/event', async (req, res) => {
    const { id, ...updateDetails } = req.body;

    if (!id) {
        return res.status(400).json({ error: "event ID is required" });
    }

    try {
        const updatedevent = await EVENT_SCHEMA.findByIdAndUpdate(
            id,
            { $set: updateDetails },
            { new: true, runValidators: true }
        );

        if (updatedevent) {
            res.json({ message: "event updated successfully", event: updatedevent });
        } else {
            res.status(404).json({ error: "event not found" });
        }
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ error: "Failed to update event" });
    }
});


app.delete('/event', async (req, res) => {
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ error: "event ID is required" });
    }
    try {
        const deleteevent = await EVENT_SCHEMA.findByIdAndDelete(id);

        if (deleteevent) {
            res.json({ message: "event deleted successfully", event: deleteevent });
        } else {
            res.status(404).json({ error: "event not found" });
        }
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ error: "Failed to delete event" });
    }
});



//About
app.get('/about', async (req, res) => {
    try {
        let about = await About_Schema.find();
        if (!about) {
            res.json("No about found")
        }
        res.json(about)

    } catch (error) {
        console.error("Error searching about :", error);
        res.status(500).json({ error: "Error searching about" });
    }
});

app.post('/about', async (req, res) => {
    const { about,version } = req.body;

    if (!about || !version) {
        return res.status(400).json({ error: "about or version are required" });
    }

    try {
        const createabout = await About_Schema.create({
about,
version
        });

        res.status(201).json({ message: "about created", createabout });
    } catch (error) {
        console.error("Error creating about:", error);
        res.status(500).json({ error: "Failed to create about" });
    }
});




app.put('/about', async (req, res) => {
    const { id, ...updateDetails } = req.body;

    if (!id) {
        return res.status(400).json({ error: "about ID is required" });
    }

    try {
        const aboutup = await About_Schema.findByIdAndUpdate(
            id,
            { $set: updateDetails },
            { new: true, runValidators: true }
        );

        if (aboutup) {
            res.json({ message: "about updated successfully", about: aboutup });
        } else {
            res.status(404).json({ error: "about not found" });
        }
    } catch (error) {
        console.error("Error updating about:", error);
        res.status(500).json({ error: "Failed to update about" });
    }
});


app.delete('/about', async (req, res) => {
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ error: "about ID is required" });
    }
    try {
        const deleteabout = await About_Schema.findByIdAndDelete(id);

        if (deleteabout) {
            res.json({ message: "about deleted successfully", about: deleteabout });
        } else {
            res.status(404).json({ error: "about not found" });
        }
    } catch (error) {
        console.error("Error deleting about:", error);
        res.status(500).json({ error: "Failed to delete about" });
    }
});





//Help
app.get('/help', async (req, res) => {
    try {
        let help = await Help_Schema.find();
        if (!help) {
            res.json("No help found")
        }
        res.json(help)

    } catch (error) {
        console.error("Error searching help :", error);
        res.status(500).json({ error: "Error searching help" });
    }
});

app.post('/help', async (req, res) => {
    const { info,url } = req.body;

    if (!info || !url) {
        return res.status(400).json({ error: "help or version are required" });
    }

    try {
        const createhelp = await Help_Schema.create({
info,
url
        });

        res.status(201).json({ message: "help created", createhelp });
    } catch (error) {
        console.error("Error creating help:", error);
        res.status(500).json({ error: "Failed to create help" });
    }
});




app.put('/help', async (req, res) => {
    const { id, ...updateDetails } = req.body;

    if (!id) {
        return res.status(400).json({ error: "help ID is required" });
    }

    try {
        const helpup = await Help_Schema.findByIdAndUpdate(
            id,
            { $set: updateDetails },
            { new: true, runValidators: true }
        );

        if (helpup) {
            res.json({ message: "help updated successfully", help: helpup });
        } else {
            res.status(404).json({ error: "help not found" });
        }
    } catch (error) {
        console.error("Error updating help:", error);
        res.status(500).json({ error: "Failed to update help" });
    }
});


app.delete('/help', async (req, res) => {
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ error: "help ID is required" });
    }
    try {
        const deletehelp = await Help_Schema.findByIdAndDelete(id);
        

        if (deletehelp) {
            res.json({ message: "help deleted successfully", help: deletehelp });
        } else {
            res.status(404).json({ error: "help not found" });
        }
    } catch (error) {
        console.error("Error deleting help:", error);
        res.status(500).json({ error: "Failed to delete help" });
    }
});


let selfCall = async () => {
    try {
        let res = await axios.get(process.env.SELF_URI, {
            headers: {
                'Authorization': process.env.SECRET_KEY
            }
        });



    } catch (error) {
        console.error("Error in selfCall:", error.message);
    }
};

setInterval(() => {
    selfCall();
}, 7 * 60 * 1000);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
