const path = require("path")

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"))

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId")

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res){
    res.json({ data: orders })
 }

function hasValidBody(bodyType) {
    return function (req, res, next) {
        const { data = {} } = req.body
        if (data[bodyType]) {
            return next()
        } 
        next({ status: 400, message: `Must include a ${bodyType}`})

    }
}

function empty(bodyType) {
    return function (req, res, next) {
        const { data = {} } = req.body

        if (bodyType === "dishes") {
            if (bodyType.length === 0) {next({ status: 400, message: `${bodyType} must not be empty ${data[bodyType]}`})} else if (Array.isArray(data[bodyType]) === false) {
                next({ status: 400, message: `${bodyType} must not be array ${data[bodyType]}`})
            }
        }


        if (data[bodyType].toString().length > 0) {
            return next()
        } 
        next({ status: 400, message: `${bodyType} must not be empty ${data[bodyType]}`})

    }
}


function read(req, res) {
    const { orderId } = req.params
    const found = orders.find(order => order.id === orderId)

    res.json({ data: found })
}


function validateOrder(req, res, next) {
    const { orderId } = req.params
    const exists = orders.some(order => order.id === orderId)

    if (exists) {
        next()
    } else {
        next({status: 404, message: `Order Id ${orderId} is not valid`})
    }

}

function validateDishQuantity(req,res,next) {
    const { data: { dishes } } = req.body
    const check = dishes.every(dish => dish.quantity)
    check ? next() : next({status: 400, message: `${dishes[0].quantity} all dishes must have quantity`})
}

function validateDishQuantityZero(req, res, next) {
    const { data: { dishes } } = req.body
    const check = dishes.some(dish => dish.quantity === 0)
    check ? next({status: 400, message: `${dishes[0].quantity} must have quantity`}) : next()
}

function validateInteger(req, res, next) {
    const { data: { dishes } } = req.body
    const check = dishes.every(dish => Number. isInteger(dish.quantity))
    check ? next() : next({status: 400, message: `${dishes[1].quantity} all dishes must have quantity`})
}

function update(req, res, next) {
    const { orderId } = req.params
    const { data: { id , deliverTo, mobileNumber, status, dishes } = {} } = req.body
    
    const found = orders.find(order => order.id === orderId)

    if (id) {if (id !== orderId) { return next({ status: 400, message: `id: ${id}, Route: ${orderId}`})}}

    found.deliverTo = deliverTo
    found.mobileNumber = mobileNumber
    found.status = status
    found.dishes = dishes

    res.json({ data: found })

} 

function isDelivered(req, res, next) {
    const { data: { status } = {} } = req.body

    if (status === "pending") {return next()} else if (status === "out-for-delivery") {return next()} else if (status === "preparing") {return next()} else if (status === "delivered") {
        return next()} else {return next({ status: 400, message: `status ${status} is inavalid`})}

}

let lastOrderId = orders.reduce((maxId, order) => Math.max(maxId, order.id), 0)

function create(req, res, next) {
    const { data: { deliverTo, mobileNumber, dishes} = {}} = req.body

    const newOrder = {
        id: ++lastOrderId,
        deliverTo,
        mobileNumber,
        status: "pending",
        dishes
    }

    orders.push(newOrder)

    res.status(201).json({ data: newOrder })

}

function destroy(req, res, next) {
    const { orderId } =  req.params
    const found = orders.find(order => order.id === orderId)
    const index = orders.findIndex(order => order.id === orderId)

    if (found.status !== "pending") {return next({ status: 400, message: `An order cannot be deleted unless it is pending`})} else {
        orders.splice(index, 1)
        res.sendStatus(204)
    }
}




module.exports = {
    list,
    read: [validateOrder, read],
    update: [validateOrder, 
             hasValidBody("mobileNumber"),
              empty("mobileNumber"),
              hasValidBody("deliverTo"),
              empty("deliverTo"), 
              hasValidBody("dishes"),
              empty("dishes"),
              hasValidBody("status"),
              empty("status"),
              isDelivered,
              validateDishQuantity,
              validateDishQuantityZero,
              validateInteger,
            update],
    create: [ hasValidBody("mobileNumber"),
              empty("mobileNumber"),
              hasValidBody("deliverTo"),
              empty("deliverTo"), 
              hasValidBody("dishes"),
              empty("dishes"),
              validateDishQuantity,
              validateDishQuantityZero,
              validateInteger,
              create],
    delete: [validateOrder,
            destroy]
}