const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://assignment-11-de1f3.web.app',
    'https://assignment-11-de1f3.firebaseapp.com',
    'https://awesome-blog-steel.vercel.app'

  ],
  credentials: true,
  optionSuccessStatus: 200,
}

// middleWere
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser())

// verify jwt middleware

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).send({ message: "unauthorized access" })
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.log(err)
        return res.status(401).send({ message: "unauthorized access" })
      }
      console.log(decoded)
      req.user = decoded
      next()
    })
  }
}





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ouoa8yh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const blogCollection = client.db('blogDB').collection('blog');
    const commentCollection = client.db('blogDB').collection('comment')
    const wishCollection = client.db('blogDB').collection('wishlist')

    // jwt generate
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "7d"
      })
      // res.send(token)
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
      }).send({ success: true })
    })

    //  Clear token
    app.get('/logout', (req, res) => {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 0
      }).send({ success: true })
    })


    // Post blog
    app.post('/blogs', async (req, res) => {
      const newBlog = req.body;
      const result = await blogCollection.insertOne(newBlog);
      res.send(result,allResult);
    });

    // Post Comment
    app.post('/comments', async (req, res) => {
      const newComment = req.body;
      const result = await commentCollection.insertOne(newComment);
      res.send(result)
    })

    // Post WishList
    app.post('/wish', async (req, res) => {
      const newWishList = req.body;
      const result = await wishCollection.insertOne(newWishList);
      res.send(result)
    })

    // Wish List Get
    app.get('/blogs/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await wishCollection.find(query).toArray();
      res.send(result)
    })
    // Wish List Delete
    app.delete('/wish/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishCollection.deleteOne(query)
      res.send(result)
    })
    // Update Blog's put
    app.put('/blog/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateBlog = req.body;
      const blog = {
        $set: {
          title: updateBlog.title,
          longdescription: updateBlog.longdescription,
          photo: updateBlog.photo,
          email: updateBlog.email,
          description: updateBlog.description,
        }
      }
      const result = await blogCollection.updateOne(filter, blog, options);
      res.send(result)
    })

    // Comments section get
    app.get('/comments', async (req, res) => {
      const cursor = commentCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    // All Blog Page's Get
    app.get('/blogs', async (req, res) => {
      // const filter=req.query.filter;
      // let query={}
      // if(filter) query={category:filter}
      // const allResult=await blogCollection.find(query)
      const cursor = blogCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    // Blog Details Get
    app.get('/single-blogs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogCollection.findOne(query);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send("server is running")
});

app.listen(port, () => {
  console.log(`server running on port: ${port}`)
})