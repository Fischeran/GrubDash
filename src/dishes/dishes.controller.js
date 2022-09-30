const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res){
   res.json({ data: dishes })
}

function hasValidBody(bodyType) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[bodyType]) {
            return next()
        } 
        next({ status: 400, message: `Must include a ${bodyType}`})

    }
}

function empty(bodyType) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[bodyType].toString().length > 0) {
            return next()
        } 
        next({ status: 400, message: `${bodyType} must not be empty ${data[bodyType]}`})

    }
}

let lastDishId = dishes.reduce((maxId, dish) => Math.max(maxId, dish.id), 0)

function create(req, res, next) {
 const { data: { name, description, price, image_url } = {} } = req.body
 const newDish = {
    id: ++lastDishId,
    name,
    description,
    price,
    image_url
 }

 if (price < 0) {return next({ status: 400, message: `price ${price} must be greater than 0`})}

 dishes.push(newDish);
 res.status(201).json({ data: newDish })
}

function read(req, res) {
    const { dishId } = req.params;
    const found = dishes.find(dish => dish.id === dishId)
    res.json({ data: found })
}

function validId(req, res, next) {
    const { dishId } = req.params;
    const exists = dishes.some(dish => dish.id === dishId);
    if (exists) {
       next()
    } else {
       next({ status: 404, message: "id does not exist"})
    }
}

function update(req, res, next) {
    const { dishId } = req.params;
    const { data: { id , name, description, price, image_url } = {} } = req.body;
    const found = dishes.find(dish => dish.id === dishId);
  
    if (price < 0 || typeof(price) !== "number") {return next({ status: 400, message: `price ${price} must be greater than 0`})};
   if (id) {if (id !== dishId) { return next({ status: 400, message: `id's ${id} must match`})}}

    found.name = name;
    found.description = description;
    found.price = price;
    found.image_url = image_url;

    res.json({ data: found })

}


module.exports = {
    list,
    create: [hasValidBody("name"),
            hasValidBody("description"),
            hasValidBody("price"),
            hasValidBody("image_url"),
            create],
    read: [validId, read],
    update: [validId,
            hasValidBody("name"),
            hasValidBody("description"),
            hasValidBody("price"),
            hasValidBody("image_url"),
            empty("name"),
            empty("description"),
            empty("price"),
            empty("image_url"),
            update]
}