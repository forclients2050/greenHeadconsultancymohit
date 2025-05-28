const express = require("express");
const app = express();

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const body = require('body-parser');


require("dotenv").config();

app.use(express.json({ limit: '5000mb' }));
app.use(express.urlencoded({ limit: '5000mb', extended: true })); 

app.use(bodyParser.json());
app.use(cookieParser());

const allowedOrigins = [
  'http://localhost:5173',
  'https://greenheadconsultancy.netlify.app',
  'https://www.greenheadconsultancy.netlify.app',
  'https://greenheadsconsultants.com',
  'https://www.greenheadsconsultants.com',
  "https://www.greenheadsconsultants.com/"
  
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(body.json())


////! All import of the Mongodb
require('./admin_mongodb/config');
require('./admin_mongodb/signupMongo/signupMongo');
require('./admin_mongodb/otpServerMongo/otpServerMongo');
require('./admin_mongodb/categorySubcatMongo/categorySubcatMongo');
require('./admin_controller/blogControll/blogControll');
require('./admin_mongodb/serviceManagementMongo/serviceManagementMongo');



////! All import of the Routes

const adminSignup = require('./admin_routes/signupRoute/signupRoute')
const verifySignup = require('./admin_routes/signupRoute/verifyRoute');
const login = require('./admin_routes/loginRoute/loginRoute');
const forgetPass = require('./admin_routes/forgetPassRoute/forgetPassRoute');
const categories = require('./admin_routes/categorySubRoute/categorySubRoute');
const serviceManagement = require('./admin_routes/serviceManagementRoute/serviceManagementRoute');
const blogControll = require('./admin_routes/blogRoute/blogRoute');
const contactUs = require('./admin_routes/contactUsRoute/contactUsRoute');
const consultExpert = require('./admin_routes/consultExpert/consultExpertRoute')

////! All API End-Points

app.use('/', adminSignup)
app.use('/', verifySignup)
app.use('/', login)
app.use('/', forgetPass)

app.use('/', categories)

app.use('/', serviceManagement)
app.use('/api/news', blogControll)

app.use('/' , contactUs)
app.use('/' , consultExpert)


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is starting on port ${PORT}`);
});
