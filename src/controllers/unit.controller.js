const db = require("../models");
const Unit = db.Unit;
const Benchmark = db.Benchmark;

// GET all units with their benchmarks
exports.getUnits = async (req, res) => {
  try {
    // Verify association exists
    if (!Unit.associations.benchmarks) {
      throw new Error('Unit-Benchmark association not found');
    }

    const units = await Unit.findAll({
      include: [{
        model: db.Benchmark,
        as: "benchmarks",
        attributes: ['id', 'benchmarkType', 'benchmarkRef', 'benchmarkDescription'],
        required: false // Use left join instead of inner join
      }],
      order: [
        ['unitName', 'ASC'],
        ['unitStartDate', 'ASC'],
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
        attributes: ['id', 'benchmarkType', 'benchmarkRef', 'benchmarkDescription']
      }]
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

// CREATE a new unit with optional benchmarks
exports.createUnit = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { benchmarks, ...unitData } = req.body;

    const newUnit = await Unit.create(unitData, { transaction });

    if (benchmarks && benchmarks.length > 0) {
      const benchmarksWithUnitId = benchmarks.map(benchmark => ({
        ...benchmark,
        unitId: newUnit.id
      }));
      
      await Benchmark.bulkCreate(benchmarksWithUnitId, { transaction });
    }

    await transaction.commit();
    
    try {
      // Fetch the newly created unit with benchmarks
      const createdUnit = await Unit.findByPk(newUnit.id, {
        include: [{
          model: Benchmark,
          as: "benchmarks",
          attributes: ['id', 'benchmarkType', 'benchmarkRef', 'benchmarkDescription']
        }]
      });

      return res.status(201).json(createdUnit);
    } catch (fetchError) {
      console.error("Error fetching created unit:", fetchError);
      return res.status(201).json({
        ...newUnit.toJSON(),
        message: "Unit created but could not fetch full details"
      });
    }
    
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error("Error creating unit:", error);
    res.status(500).json({ 
      message: "Error creating unit", 
      error: error.message,
      details: error.errors?.map(err => err.message) // Include validation errors if any
    });
  }
};

// UPDATE a unit and its benchmarks
exports.updateUnit = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { benchmarks, ...unitData } = req.body;

    const unit = await Unit.findByPk(id, { transaction });
    if (!unit) {
      await transaction.rollback();
      return res.status(404).json({ message: "Unit not found" });
    }

    // Update unit
    await unit.update(unitData, { transaction });

    // Handle benchmarks updates
    if (benchmarks) {
      // First delete existing benchmarks
      await Benchmark.destroy({ 
        where: { unitId: unit.id },
        transaction
      });

      // Then create new ones if provided
      if (benchmarks.length > 0) {
        const benchmarksWithUnitId = benchmarks.map(benchmark => ({
          ...benchmark,
          unitId: unit.id
        }));
        
        await Benchmark.bulkCreate(benchmarksWithUnitId, { transaction });
      }
    }

    await transaction.commit();

    // Fetch updated unit with benchmarks
    const updatedUnit = await Unit.findByPk(id, {
      include: [{
        model: Benchmark,
        as: "benchmarks",
        attributes: ['id', 'benchmarkType', 'benchmarkRef', 'benchmarkDescription']
      }]
    });

    res.status(200).json(updatedUnit);
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating unit:", error);
    res.status(500).json({ 
      message: "Error updating unit", 
      error: error.message,
      details: error.errors?.map(err => err.message)
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