//jshint esversion:6

const express = require('express');
const mongoose = require('mongoose');
const app = express();
var _ = require('lodash');

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect(
	'mongodb+srv://admin-yuri:Test123@cluster0.urvac.mongodb.net/todolistDB',
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
	}
);

const itemsSchema = new mongoose.Schema({
	name: String,
});

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
	name: 'Welcome to your todo list!',
});

const item2 = new Item({
	name: 'Hit the + to add a new item',
});

const item3 = new Item({
	name: '<-- Hit this to delete an item',
});

const defaultItems = [item1, item2, item3];

const listSchema = {
	name: String,
	items: [itemsSchema],
};

const List = mongoose.model('List', listSchema);

app.get('/', function (req, res) {
	Item.find(function (err, items) {
		if (items.length === 0) {
			Item.insertMany(defaultItems, function (err) {
				if (err) {
					console.log(err);
				} else {
					console.log('Successfully saved all the items into the database');
				}
			});
			res.redirect('/');
		} else {
			res.render('list', { listTitle: 'Today', newListItems: items });
		}
	});
});

app.post('/', function (req, res) {
	const itemName = req.body.newItem;
	const listName = req.body.list;

	const item = new Item({
		name: itemName,
	});

	if (listName === 'Today') {
		item.save();
		res.redirect('/');
	} else {
		List.findOne({ name: listName }, function (err, foundList) {
			foundList.items.push(item);
			foundList.save();
			res.redirect('/' + listName);
		});
	}
});

app.post('/delete', function (req, res) {
	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName;

	if (listName === 'Today') {
		Item.findByIdAndRemove(checkedItemId, function (err) {
			if (err) {
				console.log(err);
			} else {
				console.log('Successfully deleted the entry');
			}
		});
		res.redirect('/');
	} else {
		List.findOneAndUpdate(
			{ name: listName },
			{ $pull: { items: { _id: checkedItemId } } },
			function (err, foundList) {
				if (!err) {
					res.redirect('/' + listName);
				}
			}
		);
	}
});

app.get('/:customListName', function (req, res) {
	const customListName = _.capitalize(req.params.customListName);

	List.findOne({ name: customListName }, function (err, foundList) {
		if (!err) {
			if (!foundList) {
				const list = new List({
					name: customListName,
					items: defaultItems,
				});
				list.save();
				res.redirect('/' + customListName);
			} else {
				res.render('list', {
					listTitle: foundList.name,
					newListItems: foundList.items,
				});
			}
		}
	});
});

app.get('/about', function (req, res) {
	res.render('about');
});

app.listen(process.env.PORT || 3000, function () {
	console.log('Server has started successfully');
});
