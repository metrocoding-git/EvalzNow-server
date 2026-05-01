// const app = require('./app');
// const db = require('./models');
// const { PORT } = require('./config/env');

// db.sequelize.authenticate()
//   .then(() => console.log('✅ Database connected'))
//   .catch(err => console.error('❌ DB connection failed:', err));

// db.sequelize.sync({ alter: true }).then(() => {
//   app.listen(PORT, () => {
//     console.log(`🚀 Server running on port ${PORT}`);
//   });
// });


const app = require('./app');
const db = require('./models');
const { PORT } = require('./config/env');

db.sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('❌ DB connection failed:', err));
