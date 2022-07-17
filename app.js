const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const express = require("express");
const dotenv = require("dotenv");
const _ = require("lodash");
const app = express();
dotenv.config();

// set view engine
app.set('view engine', 'ejs');

// use body-parser
app.use(bodyParser.urlencoded({ extended: true }));

// use express static
app.use(express.static("public"));

// connect mongoDB
mongoose.connect(
    process.env.MONGO_URI, {
        useUnifiedTopology: true,
        useNewUrlParser: true
    },
    () => {
        console.log("Database connected successfully!");
    }
);

// item database schema
const itemsSchema = {
    name: String
};

// create item database
const Item = mongoose.model("Item", itemsSchema);

// insert item into item database
const item1 = new Item({
    name: "Welcome to your todolist!"
});

// insert item into item database
const item2 = new Item({
    name: "Hit + button to add new item."
});

// insert item into item database
const item3 = new Item({
    name: "<== Hit here to delete an item."
});

const defaultItems = [item1, item2, item3];

// custom list schema
const listSchema = {
    name: String,
    items: [itemsSchema]
}

// create custom list database
const List = mongoose.model("List", listSchema);


// get route for default list at "/"
app.get("/", function (req, res) {
    Item.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err)
                    console.log(err);
                else
                    console.log("Successfully saved default items to DB.");
            });
            res.redirect("/");
        }
        else {
            res.render("list", {
                listTitle: "To Do List",
                newListItems: foundItems
            });
        }
    });
});


// get route for custom list "/:customListName"
app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            }
            else {
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items
                });
            }
        }
    });
});


app.post("/", async function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });
    if (itemName.trim().length) {
        if (listName === "To Do List") {
            await item.save();
            console.log("Successfully saved new item to DB.");
            res.redirect("/");
        }
        else {
            await List.findOne({name: listName}, async function (err, foundList) {
                await foundList.items.push(item);
                await foundList.save();
                console.log("Successfully saved new item to DB." + listName);
                res.redirect("/" + listName);
            });
        }
    }
    else {
        (listName === "To Do List") ? res.redirect("/") : res.redirect("/" + listName);
    }
});


app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "To Do List") {
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (!err) {
                console.log("Successfully deleted checked item.");
                res.redirect("/");
            }
            else {
                console.log(err);
            }
        });
    }
    else {
        List.findOneAndUpdate(
            {name: listName}, 
            {$pull: {items: {_id: checkedItemId}}},
            function (err, result) {
                if (!err) {
                    console.log("Successfully deleted checked item.");
                    res.redirect("/" + listName);
                }
                else {
                    console.log(err);
                }
            }
        );
    }
});

port = process.env.PORT || 3000;

app.listen(port, function() {
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});