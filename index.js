require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
const { getMessaging } = require("firebase-admin/messaging");
const app = express();

var serviceAccount = require("./pmc-cskh-firebase-adminsdk-y7378-5122f6edc7.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// This registration token comes from the client FCM SDKs.
app.get("/test-noti", async (req, res) => {
  const registrationTokens = [
    "ExponentPushToken[CzoGcLH9L4wqJGVB9V-68-]",
    "ExponentPushToken[0eplaPHQHUcrFvaEm24iMe]",
  ];

  const message = {
    notification: {
      title: "Hello World 2",
      body: "Test Body 2",
    },
    tokens: registrationTokens,
  };

  getMessaging()
    .sendEachForMulticast(message)
    .then((response) => {
      res.json({ response });
      console.log(response.successCount + " messages were sent successfully");
    })
    .catch((err) => {
      console.log(err);
    });
});

var corsOptions = {
  origin: [
    "*",
    "http://localhost:3000",
    "http://localhost:3636",
    "https://checklist.pmcweb.vn",
    "https://minhepzai.cckvn.vn",
    "http://minhepzai.cckvn.vn",
    "http://demo.pmcweb.vn",
    "https://demo.pmcweb.vn",
    "https://qlts.pmcweb.vn",
  ],

  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json({ limit: "500mb" }));
app.use(bodyParser.urlencoded({ limit: "500mb", extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use("/upload", express.static("app/public"));

app.get("/", (req, res) => {
  res.json("Hello World!");
});

require("./app/routes/ent_calv.route")(app);
require("./app/routes/ent_user.route")(app);
require("./app/routes/ent_tang.route")(app);
require("./app/routes/ent_toanha.route")(app);
require("./app/routes/ent_khuvuc.route")(app);
require("./app/routes/ent_thietlapca.route")(app);
require("./app/routes/ent_duan.route")(app);
require("./app/routes/ent_hangmuc.route")(app);
require("./app/routes/ent_khoicv.route")(app);
require("./app/routes/ent_checklist.route")(app);
require("./app/routes/ent_chucvu.route")(app);
require("./app/routes/tb_checklistc.route")(app);
require("./app/routes/tb_checklistchitiet.route")(app);
require("./app/routes/tb_checklistchitietdone.route")(app);
require("./app/routes/ent_duan_khoicv.route")(app);
require("./app/routes/tb_sucongoai.route")(app);
require("./app/routes/mail.route")(app);

const PORT = process.env.PORT || 6969;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
