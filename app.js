const express = require('express')
const {ObjectId, MongoClient} = require('mongodb')
const cors = require('cors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {v4:uuidv4} = require('uuid')
const app = express()

app.use(express.json())
app.use(cors())


let client
const initializeDBAndServer = async () => {
    const dbPassword = 'Raviteja%40123'

    const uri = `mongodb+srv://raviteja:${dbPassword}@cluster0.odj14.mongodb.net/onlineFoodOrder?retryWrites=true&w=majority&appName=Cluster0`

    client = new MongoClient(uri)
    
    try{
        await client.connect()
        console.log('Connected to MongoDB...')

        app.listen(3000, () => {
            console.log('Server Running at port:3000')
        })
    }
    catch(e){
        console.log(`Error Connecting to MongoDB: ${e.message}`)
        process.exit(1)
    }
}

initializeDBAndServer()

// Middleware Function to ensure only authenticated users can only access certain Routes

const authenticateToken = (request, response, next) => {
    let jwtToken

    const authHeader = request.headers["authorization"]

    if(authHeader !== undefined){
        jwtToken = authHeader.split(" ")[1]
    }
    if(jwtToken === undefined){
        response.status(401)
        response.send({errorMsg: "Invalid JWT Token"})
    }
    else{
        jwt.verify(jwtToken, "MY_SECRET_TOKEN", async(error, payload)=> {
            if(error){
                response.status(401)
                response.send({errorMsg: error})
            }
            else{
                request.userId = payload.userId
                next();
            }
        })
    }

}


// API-1 Creating New User Account

app.post('/register', async(request, response) => {
    const collection = client.db('onlineFoodOrder').collection('users')
    const {name, email, password} = request.body

    const checkUserInDB = await collection.find(
        {email}
    ).toArray();

    if(checkUserInDB.length === 0){
        const hashedPassword = await bcrypt.hash(password, 10)

        if(name !==undefined){
            await collection.insertOne({
                name: name,
                email: email,
                password: hashedPassword
            })
            
            response.status(201)
            response.send('User Registered Successfully')
        }
        else{
            response.status(401)
            response.send({errorMsg: 'Please Enter Valid User Details'})
        }
        
    }
    else{
        response.status(401)
        response.send({errorMsg: "User Already Exists"})
    }
})


// API-2 User Login

app.post('/login', async(request, response) => {
    const {email, password} = request.body
    const collection = client.db('onlineFoodOrder').collection('users')
    
    const checkUserInDB = await collection.find({email}).toArray()
    
    if(checkUserInDB.length === 1){
        const verifyPassword = await bcrypt.compare(password, checkUserInDB[0].password)
        if(verifyPassword){
            const token = jwt.sign({userId: checkUserInDB[0]._id }, 'MY_SECRET_TOKEN')
            response.status(201)
            response.send({jwtToken: token})
        }
        else{
            response.status(401)
            response.send({errorMsg: 'Incorrect Password'})
        }

    }
    else{
        response.status(401)
        response.send({errorMsg: "User Doesn't Exists"})
    }

})


// API-3 Update Profile Details

app.put('/profile', authenticateToken, async(request, response) => {
    const {name, email, phone, addresses} = request.body

    try{
        const findUserId = new ObjectId(request.userId) // It converts userId to Object Id
        const collection = client.db('onlineFoodOrder').collection('users')
        const findUser = await collection.findOne({
            _id: findUserId
        })

        const updateUserDetails = await collection.updateOne(
            { _id: findUserId },
            { 
                $set: {
                    name: name || findUser.name,       
                    email: email || findUser.email,    
                    phone: phone || findUser.phone,    
                    addresses: addresses || findUser.addresses
                }
            }
        );

        const getData = await collection.findOne({
            _id: findUserId
        })

        response.status(201)
        response.send(JSON.stringify("User Details Updated Successfully"))
    }
    catch(e){
        response.status(401)
        response.send({errorMsg: e})
    }    

})


// API-4 Get User Details

app.get('/profile', authenticateToken, async(request, response) => {
    const getUserId = new ObjectId(request.userId)
    const collection = client.db('onlineFoodOrder').collection('users')

    const userDetails = await collection.findOne({_id: getUserId})
    if(userDetails !== undefined){
        response.status(201)
        response.send({userDetails: userDetails})
    }
    else{
        response.status(401)
        response.send({errorMsg: "User Not Found"})
    }
})


// API-5 Create Restaurant Account

app.post('/restaurants', async(request, response) => {
    const {name, location, password} = request.body

    const collection = client.db('onlineFoodOrder').collection('restaurants')

    const checkRestaurantInDB = await collection.find({name}).toArray()

    const hashedPassword = await bcrypt.hash(password, 10)

    if(checkRestaurantInDB.length === 0){
        if(name !== undefined && location !== undefined){
            await collection.insertOne({
                name: name,
                location: location,
                password: hashedPassword
            })

            response.status(201)
            response.send("Restaurant Created Successfully")
        }
        else{
            response.status(401)
            response.send({errorMsg: "Please Enter Valid Details"})
        }
    }
    else{
        response.status(401)
        response.send({errorMsg: "Restaurant Already Exists"})
    }
})


// API-6 Restaurant Admin Login

app.post("/restaurants/admin", async(request, response) => {
    const {name, password} = request.body

    const collection = client.db('onlineFoodOrder').collection('restaurants')

    const checkRestaurantInDB = await collection.find({name}).toArray()

    if(checkRestaurantInDB.length === 1){
        const verifyPassword = await bcrypt.compare(password, checkRestaurantInDB[0].password)

        if(verifyPassword){
            const restaurantId = checkRestaurantInDB[0]._id.toString()
            const token = jwt.sign({userId: restaurantId}, 'MY_SECRET_TOKEN')

            console.log(restaurantId)
            response.status(201)
            response.send({jwtToken: token})
        }
        else{
            response.status(401)
            response.send({errorMsg: "Invalid Restaurant Admin Password"})
        }
    }
    else{
        response.status(401)
        response.send({errorMsg: "Restaurant Doesn't Exists"})
    }
})


// API-7 GET Restaurant Details

app.get('/restaurants', authenticateToken, async(request, response) => {
    
    const restaurantId = new ObjectId(request.userId)
    const collection = client.db('onlineFoodOrder').collection('restaurants')

    const getRestaurantDetails = await collection.findOne({_id: restaurantId})

    console.log(getRestaurantDetails)
})


// API-8 Update Restaurant Details

app.put('/restaurants/:restaurantId', authenticateToken, async(request, response) => {
    const {restaurantId} = request.params
    const {name, location} = request.body
    const convertID = new ObjectId(restaurantId)
    const collection = client.db('onlineFoodOrder').collection('restaurants')

    const getRestaurantDetails = await collection.find({_id: convertID}).toArray()

    if(getRestaurantDetails !== undefined){
        const updateRestaurantDetails = await collection.updateOne(
            { _id: convertID },
            {
                $set: {
                    name: name || getRestaurantDetails[0].name,
                    location: location || getRestaurantDetails[0].location
                }   
            }
        )
    
        const newData = await collection.findOne({_id: convertID})
        console.log(newData)

        response.status(201)
        response.send("Restaurant Details Updated Successfully")
    }
    else{
        response.status(401)
        response.send({errorMsg: "Invalid Restaurant Details"})
    }
})


// API-9 Add Items to the Restaurant Menu

app.post('/restaurants/:restaurantId/menu', authenticateToken, async(request, response) => {
    const {restaurantId} = request.params
    const {dishName, description, price, category, availability} = request.body

    const convertID = new ObjectId(restaurantId)
    const collection = client.db('onlineFoodOrder').collection('restaurants')

    const getRestaurantDetails = await collection.findOne({_id: convertID})
    
    if(getRestaurantDetails !== undefined){

        if(getRestaurantDetails){

            // Verify whether menu and category object is available or not

            getRestaurantDetails.menu = getRestaurantDetails.menu || {}
            getRestaurantDetails.menu.category = getRestaurantDetails.menu.category || {}

            // Initialize Category Type Arrays

            getRestaurantDetails.menu.category.starters = getRestaurantDetails.menu.category.starters  || []
            getRestaurantDetails.menu.category.mainCourse = getRestaurantDetails.menu.category.mainCourse || []
            getRestaurantDetails.menu.category.beverages = getRestaurantDetails.menu.category.beverages || []
        }

        const itemId = uuidv4()

        switch(category){
            case "Starters":
                getRestaurantDetails.menu.category.starters.push({itemId, dishName, description, price, availability})
                break
            
            case "Main Course":
                getRestaurantDetails.menu.category.mainCourse.push({itemId, dishName, description, price, availability})
                break

            case "Beverages":
                getRestaurantDetails.menu.category.beverages.push({itemId, dishName, description, price, availability})
                break
            
            default:
                return response.status(401).send({errorMsg: "Invalid Category"})
        }

            
        await collection.updateOne(
            {_id: convertID},
            {
                $set: {menu: getRestaurantDetails.menu}
            }
        )

        response.status(201)
        response.send("Item Added Successfully")
    }
    else{
        response.status(401)
        response.send({errorMsg: "Invalid Restaurant Details Provided"})
    }
})


// API-10 Update a Specific Menu Item Details

app.put('/restaurants/:restaurantId/menu/:itemId', authenticateToken, async(request, response) => {
    const {restaurantId, itemId} = request.params
    const {dishName, description, price, availability} = request.body
    const convertID = new ObjectId(restaurantId)
    const collection = client.db('onlineFoodOrder').collection('restaurants')
    const getRestaurantDetails = await collection.findOne({_id: convertID})

    if(getRestaurantDetails !== undefined){
        let categoriesList = Object.keys(getRestaurantDetails.menu.category) // To Get all the available categories in the restaurant
        
        let itemFound
        let categoryKey

        for(let eachCategory of categoriesList){
            const items = getRestaurantDetails.menu.category[eachCategory] || []
            const item = items.find(each => each.itemId === itemId)

            if(item){
                itemFound = item
                categoryKey = eachCategory
                break
            }
        }

        if(!itemFound){
            response.status(404)
            response.send("Item Not Found")
        }
        else{

            // Update the item details based on the user inputs provided not null or undefined
            if(dishName) itemFound.dishName = dishName
            if(description) itemFound.description = description
            if(price) itemFound.price = price
            if(availability !== undefined) itemFound.availability = availability

            await collection.updateOne(
                {_id: convertID},
                {
                    $set: {
                        [`menu.category.${categoryKey}`]: getRestaurantDetails.menu.category[categoryKey]
                    }
                }
            )

            response.status(201)
            response.send("Item Details Updated Successfully")
        }

    }
    else{
        response.status(401)
        response.send({errorMsg: "Invalid Restaurant Details"})
    }

})


// API-11 Place a New Order

app.post('/orders', authenticateToken, async(request, response) => {
    const {userId} = request
    const {restaurantName, orderDetails} = request.body

    const convertID = new ObjectId(userId)

    const restaurantCollection = client.db('onlineFoodOrder').collection('restaurants')
    const userCollection = client.db("onlineFoodOrder").collection('users')
    const ordersCollection = client.db("onlineFoodOrder").collection('orders')
    
    const getRestaurantData = await restaurantCollection.findOne({name: restaurantName})
    const getUserData = await userCollection.findOne({_id: convertID})
    
    if(getUserData){
        const deliveryAddress = getUserData.addresses[0] // Select User Delivery Address
        const orderId = uuidv4()

        if(!getUserData.orders){
            getUserData.orders = []
        }

        let categoriesList = Object.keys(getRestaurantData.menu.category)
        
        let totalAmount = 0
        let totalItems = 0

        for (let each of categoriesList){
            for(let eachItem of orderDetails){
                const verifyItemInRestaurant = getRestaurantData.menu.category[each].find(each => each.dishName === eachItem.dishName)
                if(verifyItemInRestaurant){
                    let dishQuantity = eachItem.quantity
                    let dishPrice = verifyItemInRestaurant.price

                    totalItemPrice = dishPrice * dishQuantity
                    totalAmount += totalItemPrice
                    totalItems += 1
                }
            }
        }

        const calculatedeliveryTime = Date.now() + 30 * 60 * 1000
        const currentTime = Date.now()
        const deliveryTime = Math.floor((calculatedeliveryTime - currentTime)/1000/60)

        const newOrder = {
            orderId: uuidv4(),
            orderItems: orderDetails,
            totalItems: totalItems,
            totalAmount: totalAmount,
            deliveryAddress: deliveryAddress,
            estimatedDeliveryTime: `${deliveryTime} minutes`,
            status: "Pending"
        }

        const updateIntoOrdersCollection = {
            _id: newOrder.orderId,
            userId: convertID,
            orderItems: orderDetails,
            totalItems: totalItems,
            totalAmount: totalAmount,
            deliveryAddress: deliveryAddress,
            status: "Pending"
        }

        await ordersCollection.insertOne(updateIntoOrdersCollection)

        await userCollection.updateOne(
            {_id: convertID},
            {
                $push: {
                    orders: newOrder
                }
            }
        )

        response.status(201)
        response.send("Successfully Ordered")

    }
    else{
        response.status(401)
        response.send({errorMsg: "Invalid User Details"})
    }
})


// API-12 Get Order Details Using Order Id

app.get('/orders/:orderId', authenticateToken, async(request, response) => {
    const {orderId} = request.params
    const {userId} = request

    const convertID = new ObjectId(userId)

    const usersCollection = client.db('onlineFoodOrder').collection('users')
    const ordersCollection = client.db('onlineFoodOrder').collection('orders')

    const getUserData = await usersCollection.findOne({_id: convertID})

    if(getUserData){
        const getOrderDetails = await ordersCollection.findOne({_id: orderId})
        if(getOrderDetails){
            response.status(201)
            response.send(getOrderDetails)
        }
        else{
            response.status(201)
            response.send({errorMsg: "Invalid Order Details"})
        }
    }
    else{
        response.status(401)
        response.send({errorMsg: "Invalid User"})
    }
    
})

// API-13 Update Order Status using Order Id (Can accessed only by admins)

app.put('/orders/:orderId/status', authenticateToken, async(request, response) => {
    const {orderId} = request.params
    const {userId} = request // Restaurant Id
    const convertID = new ObjectId(userId)

    const {orderStatus} = request.body

    const restaurantCollection = client.db('onlineFoodOrder').collection('restaurants')
    const ordersCollection = client.db('onlineFoodOrder').collection('orders')
    const getOrderData = await ordersCollection.findOne({_id: orderId})

    if(getOrderData) {
        const getRestaurantData = await restaurantCollection.findOne({_id: convertID})

        if(getRestaurantData){
            const getOrderDetails = await ordersCollection.findOne({_id: orderId})
            const userId = getOrderDetails.userId

            const usersCollection = client.db('onlineFoodOrder').collection('users')
            const getUserData = await usersCollection.findOne({_id: userId})
            
            await ordersCollection.updateOne(
                {_id: orderId},
                {
                    $set: {"status": orderStatus}
                }
            )

            await usersCollection.updateOne(
                {_id: userId, "orders.orderId": orderId},
                {
                    $set: {"orders.$.status": orderStatus}
                }
            )

            response.status(201)
            response.send("Order Status Updated Successfully")
        }
        else{
            response.status(401)
            response.send({errorMsg: "Restaurant Access Denied"})
        }
    }

    else{
        response.status(401)
        response.send({errorMsg: "Invalid Order Details"})
    }

})

// API - 14  GET all the orders of loggedin user

app.get('/orders', authenticateToken, async(request, response) => {
    const {userId} = request
    const convertID = new ObjectId(userId)

    const userCollection = client.db('onlineFoodOrder').collection('users')
    const getUserData = await userCollection.findOne({_id: convertID})

    if(getUserData){
        const allOrders = getUserData.orders
        response.status(201)
        response.send(allOrders)
    }
    else{
        response.status(401)
        response.send({errorMsg: "Invalid User"})
    }
})