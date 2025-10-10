const db = require("../models");
const Unit = db.Unit;
const Benchmark = db.Benchmark;
const Account = db.Account;
const Client = db.Client;
const StaffLookup = db.StaffLookup; 

// GET all units with their benchmarks
exports.getUnits = async (req, res) => {
  try {

    // const userAccId = req.user?.acc_id; // get accountId from logged-in user
    // if (!userAccId) {
    //   return res.status(401).json({ message: 'Unauthorized: accountId missing' });
    // }
    const { clientId } = req.params;

    // Verify association exists
    if (!Unit.associations.benchmarks) {
      throw new Error('Unit-Benchmark association not found');
    }

     // ✅ Ensure client belongs to this account
    // const client = await Client.findOne({
    //   where: { id: clientId },
    // });
    // if (!client) {
    //   return res.status(404).json({ message: "Client not found or not in your account" });
    // }

    const units = await Unit.findAll({
      where: { clientId: clientId },
      include: [
        // {
        //   model: Account, as: 'account', where: { acc_id: userAccId }, // filter by logged-in user's account
        // },
        {
        model: db.Benchmark,
        as: "benchmarks",
        attributes: ['id', 'benchmarkId', 'benchmarkType', 'benchmarkRef', 'benchmarkDescription'],
        required: false // Use left join instead of inner join
      },
      {
        model: db.Staff,
        as: "staffMembers", // alias you define in Unit.associate
        through: { 
          model: StaffLookup, 
          attributes: ["roleType"] // include Leader/Assessor info
        },
        required: false
      }],
      order: [
        ['id', 'ASC'],
        [{ model: db.Benchmark, as: 'benchmarks' }, 'benchmarkRef', 'ASC']
      ]
    });
    
    res.status(200).json(units);
  } catch (error) {
    console.error("Error fetching units:", error);
    res.status(500).json({ 
      message: "Error fetching units", 
      error: error.message,
      suggestion: "Please verify model associations are properly set up"
    });
  }
};

// GET unit by ID with benchmarks
exports.getUnitById = async (req, res) => {
  try {
    const { id } = req.params;
    const unit = await Unit.findByPk(id, {
      include: [{
        model: Benchmark,
        as: "benchmarks",
        attributes: ['id', 'benchmarkId', 'benchmarkType', 'benchmarkRef', 'benchmarkDescription']
      },
      {
        model: StaffLookup,
        as: "staffAssignments",
        attributes: ['roleType'],
        include: [
          {
            model: db.Staff,
            as: "staff",
          }
        ]
      }
    ]
    });

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    res.status(200).json(unit);
  } catch (error) {
    console.error("Error fetching unit:", error);
    res.status(500).json({ message: "Error fetching unit", error: error.message });
  }
};

// CREATE a new unit with optional benchmarks and staff lookup
exports.createUnit = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { benchmarks, staffLookup, clientId, ...unitData } = req.body;
    // `staffLookup` = array of { staffId, roleType } objects
    // Example: [{ staffId: 1, roleType: "Leader" }, { staffId: 1, roleType: "Assessor" }, { staffId: 2, roleType: "Assessor" }]

    // Step 1: Create the unit
    const newUnit = await Unit.create({ ...unitData, clientId }, { transaction });

    // Step 2: Handle benchmarks if provided
    if (benchmarks && benchmarks.length > 0) {
      const result = await Benchmark.findOne({
        where: { unitId: newUnit.id },
        attributes: [[db.sequelize.fn('MAX', db.sequelize.col('benchmarkId')), 'maxBenchmarkId']],
        raw: true,
        transaction
      });

      let nextBenchmarkId = (result?.maxBenchmarkId || 0) + 1;

      const benchmarksWithIds = benchmarks.map(b => ({
        ...b,
        unitId: newUnit.id,
        benchmarkId: nextBenchmarkId++
      }));

      await Benchmark.bulkCreate(benchmarksWithIds, { transaction });
    }

    
    // ✅ Step 3: Handle StaffLookup entries (Leaders & Assessors)
    if (staffLookup && Array.isArray(staffLookup) && staffLookup.length > 0) {
      const validRoles = ["Leader", "Assessor"];
      const staffEntries = staffLookup
        .filter(entry => validRoles.includes(entry.roleType))
        .map(entry => ({
          unitId: newUnit.id,
          staffId: entry.staffId,
          roleType: entry.roleType
        }));

      if (staffEntries.length > 0) {
        await db.StaffLookup.bulkCreate(staffEntries, { transaction });
      }
    }


    await transaction.commit();

    // Step 4: Fetch created unit with benchmarks + staff
    const createdUnit = await Unit.findByPk(newUnit.id, {
      include: [
        {
          model: Benchmark,
          as: "benchmarks",
          attributes: ['id', 'benchmarkId', 'benchmarkType', 'benchmarkRef', 'benchmarkDescription']
        },
        {
          model: db.Staff,
          as: "staffMembers",
          through: { attributes: ["roleType"] }, // include Leader/Assessor info
          attributes: ["id", "firstName", "lastName", "emailAddress"]
        }
      ]
    });

    res.status(201).json(createdUnit);

  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Error creating unit:", error);
    res.status(500).json({
      message: "Error creating unit",
      error: error.message,
      details: error.errors?.map(err => err.message)
    });
  }
};


// UPDATE a unit and its benchmarks
// UPDATE a unit, its benchmarks, and staff assignments
exports.updateUnit = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { benchmarks, staffLookup, ...unitData } = req.body;

    const unit = await Unit.findByPk(id, { transaction });
    if (!unit) {
      await transaction.rollback();
      return res.status(404).json({ message: "Unit not found" });
    }

    // ✅ Step 1: Update basic unit fields
    await unit.update(unitData, { transaction });

    // ✅ Step 2: Update Benchmarks
    if (benchmarks) {
      // Delete existing benchmarks
      await Benchmark.destroy({ where: { unitId: unit.id }, transaction });

      if (benchmarks.length > 0) {
        let nextBenchmarkId = 1;

        const benchmarksWithIds = benchmarks.map((b) => ({
          ...b,
          unitId: unit.id,
          benchmarkId: nextBenchmarkId++,
        }));

        await Benchmark.bulkCreate(benchmarksWithIds, { transaction });
      }
    }

    // ✅ Step 3: Update Staff Assignments
    if (staffLookup && Array.isArray(staffLookup)) {
      // Delete old staff assignments for this unit
      await StaffLookup.destroy({ where: { unitId: unit.id }, transaction });

      const validRoles = ["Leader", "Assessor"];
      const staffEntries = staffLookup
        .filter((entry) => validRoles.includes(entry.roleType))
        .map((entry) => ({
          unitId: unit.id,
          staffId: entry.staffId,
          roleType: entry.roleType,
        }));

      if (staffEntries.length > 0) {
        await StaffLookup.bulkCreate(staffEntries, { transaction });
      }
    }

    await transaction.commit();

    // ✅ Step 4: Fetch the updated unit with associations
    const updatedUnit = await Unit.findByPk(id, {
      include: [
        {
          model: Benchmark,
          as: "benchmarks",
          attributes: [
            "id",
            "benchmarkId",
            "benchmarkType",
            "benchmarkRef",
            "benchmarkDescription",
          ],
        },
        {
          model: db.Staff,
          as: "staffMembers",
          through: { attributes: ["roleType"] },
          attributes: ["id", "firstName", "lastName", "emailAddress"],
        },
      ],
    });

    res.status(200).json(updatedUnit);
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Error updating unit:", error);
    res.status(500).json({
      message: "Error updating unit",
      error: error.message,
      details: error.errors?.map((err) => err.message),
    });
  }
};


// DELETE a unit (benchmarks will be deleted automatically due to CASCADE)
exports.deleteUnit = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;

    const unit = await Unit.findByPk(id, { transaction });
    if (!unit) {
      await transaction.rollback();
      return res.status(404).json({ message: "Unit not found" });
    }

    await unit.destroy({ transaction });
    await transaction.commit();

    res.status(200).json({ message: "Unit and its benchmarks deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting unit:", error);
    res.status(500).json({ 
      message: "Error deleting unit", 
      error: error.message,
      suggestion: "Check if there are any foreign key constraints preventing deletion"
    });
  }
};

// Additional utility endpoints

// GET benchmarks for a specific unit
exports.getUnitBenchmarks = async (req, res) => {
  try {
    const { unitId } = req.params;
    
    const benchmarks = await Benchmark.findAll({
      where: { unitId },
      order: [['benchmarkRef', 'ASC']]
    });

    res.status(200).json(benchmarks);
  } catch (error) {
    console.error("Error fetching unit benchmarks:", error);
    res.status(500).json({ 
      message: "Error fetching unit benchmarks", 
      error: error.message 
    });
  }
};

// GET active units (where endDate is null or in the future)
exports.getActiveUnits = async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    const units = await Unit.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { unitEndDate: null },
          { unitEndDate: { [db.Sequelize.Op.gte]: date } }
        ]
      },
      include: [{
        model: Benchmark,
        as: "benchmarks",
        attributes: ['id', 'benchmarkType', 'benchmarkRef'],
        required: false
      }],
      order: [['unitStartDate', 'DESC']]
    });

    res.status(200).json(units);
  } catch (error) {
    console.error("Error fetching active units:", error);
    res.status(500).json({ 
      message: "Error fetching active units", 
      error: error.message 
    });
  }
};