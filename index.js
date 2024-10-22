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

mongoose.connect(process.env.MONGO_URL);

app.use(cors({
    credentials: true,
}));
app.use(bodyParser.json());

// const parseBusRoutes =auth, async (routesData) => {
//     for (const routeString of routesData) {
//         const parts = routeString.split(':');
//         const stopsString = parts[2].substring(0, parts[2].length - 2);
//         const stops = stopsString.split(',').map(s => s.trim());

//         let busData = {
//             name: parts[0].trim(),
//             route: parts[1].substring(0, parts[1].length - 4).trim(),
//             status: parts[3].trim(),
//             image_url: parts[4].trim(),
//             stops: stops
//         };

//         await BUS_SCHEMA.create(busData);
//     }
// };

// app.get('/read', (req, res) => {
// parseBusRoutes(routes1)
// res.json({message:"OK"})
// });


const auth = (req, res, next) => {
    try {
   
        const authHeader = req.headers['authorization']; 

        if (!authHeader) {
            return res.status(401).json({ error: 'Authorization header missing' });
        }else if (authHeader!=process.env.SECRET_KEY){

            return res.status(401).json({ error: 'Incorrect authorization header' });
        }
        next();

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

app.get('/all_bus',auth, async (req, res) => {
    try {
        const findBus = await BUS_SCHEMA.find();
        if (findBus.length === 0) {
            return res.status(404).json({ message: "Bus not found" });
        }
        res.json(findBus);
    } catch (error) {
        console.error("Error finding bus:", error);
        res.status(500).json({ error: "Failed to find bus" });
    }

});

app.post('/add_bus',auth, async (req, res) => {
    const busDetails = req.body;


    if (!busDetails.name || !busDetails.route || !busDetails.status || !busDetails.stops || !busDetails.image_url) {
        return res.status(400).json({ error: "Missing required bus details (name, route, image_url, status, and stops)" });
    }

    try {
        const newBus = await BUS_SCHEMA.create(busDetails);
        res.status(201).json({ message: true, bus: newBus });
    } catch (error) {
        console.error("Error adding bus:", error);
        res.status(500).json({ error: "Failed to add bus" });
    }
});


app.put('/update_bus',auth, async (req, res) => {
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

app.delete('/delete_bus',auth, async (req, res) => {
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


app.get('/via_bus',auth, async (req, res) => {
    const { via } = req.query;
    if (!via) {
        return res.status(400).json({ error: "Via route is required" });
    }
    if (!via) {
        return res.status(400).json({ error: "A 'via' stop must be provided" });
    }

    try {
        const buses = await BUS_SCHEMA.find({
            stops: {
                $elemMatch: { $eq: via }
            }
        });


        const filteredBuses = buses.filter(bus => {
            const index = bus.stops.indexOf(via);
            return index > 0 && index < bus.stops.length - 1;
        });

        if (filteredBuses.length > 0) {
            res.json(filteredBuses);
        } else {
            res.status(404).json({ error: "No buses found for the given stop, excluding first and last stops" });
        }
    } catch (error) {
        console.error("Error finding buses:", error);
        res.status(500).json({ error: "Failed to retrieve buses" });
    }
});

app.get('/busName',auth, async (req, res) => {
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

app.get('/from-to',auth, async (req, res) => {
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

app.get('/busId',auth, async (req, res) => {
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
app.get('/all_team_members',auth, async (req, res) => {

    try {
        const team = await TEAM_SCHEMA.find()
        res.json(team);

    } catch (error) {
        console.error("Error searching for team members:", error);
        res.status(500).json({ error: "Failed to team members" });
    }
});


app.post('/add_team_member',auth, async (req, res) => {
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

app.put('/update_team_member',auth, async (req, res) => {
    const { id, ...updateDetails } = req.body;
    if (!id) {
        return res.status(400).json({ error: "Team member ID is required" });
    }

    try {

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


app.delete('/delete_team_member',auth, async (req, res) => {
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
app.get('/all_admin',auth, async (req, res) => {

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

app.post('/add_admin',auth, async (req, res) => {
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

app.delete('/delete_admin',auth, async (req, res) => {
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

app.put('/update_admin',auth, async (req, res) => {
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
app.get('/all_news',auth, async (req, res) => {
try {
    let news=await NEWS_SCHEMA.find();
    res.json(news)

} catch (error) {
    console.error("Error searching news :", error);
    res.status(500).json({ error: "Error searching news" });
}
});

app.post('/add_news',auth, async (req, res) => {
    const newsDetails = req.body;

    if (!newsDetails.image_url || !newsDetails.url || !newsDetails.news) {
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


app.put('/update_news',auth, async (req, res) => {
    const {id,...updateDetails} = req.body; 

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


app.delete('/delete_news',auth, async (req, res) => {
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





app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
