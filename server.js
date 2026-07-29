const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ------------------------------------------
// 1. Database Schemas & Models (MUST BE FIRST)
// ------------------------------------------
const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, default: 'General' },
  rating: { type: Number, default: 4.0 }
});

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  items: Array,
  deliveryAddress: { type: String, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const Food = mongoose.model('Food', foodSchema);
const Order = mongoose.model('Order', orderSchema);

// ------------------------------------------
// 2. MongoDB Connection & Data Seeding
// ------------------------------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Successfully connected to MongoDB Database!');

    // Check if food collection is empty and seed
    const count = await Food.countDocuments();
    if (count === 0) {
      const sampleFoods = [
        {
          name: 'Paneer Butter Masala',
          price: 240,
          category: 'Main Course',
          rating: 4.5
        },
        {
          name: 'Chicken Biryani',
          price: 320,
          category: 'Biryani',
          rating: 4.8
        },
        {
          name: 'Veg Loaded Pizza',
          price: 299,
          category: 'Fast Food',
          rating: 4.3
        }
      ];

      await Food.insertMany(sampleFoods);
      console.log('Sample food items added to database successfully!');
    }
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// ------------------------------------------
// 3. API Routes
// ------------------------------------------

// Root Route
app.get('/', (req, res) => {
  res.send('Food Delivery App Server with Database is Live!');
});

// GET all foods from DB
app.get('/api/foods', async (req, res) => {
  try {
    const foods = await Food.find();
    res.json({ success: true, count: foods.length, data: foods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST new food to DB
app.post('/api/foods', async (req, res) => {
  try {
    const newFood = await Food.create(req.body);
    res.status(201).json({ success: true, data: newFood });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET all orders from DB
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST new order to DB
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = await Order.create(req.body);
    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
// PUT route to update order status
app.put('/api/orders/:id', async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
// DELETE route to remove an order by ID
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});