const db = require("../models");
const Benchmark = db.Benchmark;
const Unit = db.Unit;

// GET all benchmarks with unit info
exports.getBenchmarks = async (req, res) => {
  try {
    const benchmarks = await Benchmark.findAll({
      include: [{
        model: Unit,
        as: "unit",
        attributes: ['id', 'unitId', 'unitName', 'unitType']
      }],
      order: [
        ['unitId', 'ASC'],
        ['benchmarkRef', 'ASC']
      ]
    });
    res.status(200).json(benchmarks);
  } catch (error) {
    console.error("Error fetching benchmarks:", error);
    res.status(500).json({ 
      message: "Error fetching benchmarks", 
      error: error.message,
      suggestion: "Check if Unit-Benchmark association is properly set up"
    });
  }
};

// GET benchmark by ID with unit info
exports.getBenchmarkById = async (req, res) => {
  try {
    const { id } = req.params;
    const benchmark = await Benchmark.findByPk(id, {
      include: [{
        model: Unit,
        as: "unit",
        attributes: ['id', 'unitId', 'unitName', 'unitType']
      }]
    });

    if (!benchmark) {
      return res.status(404).json({ message: "Benchmark not found" });
    }

    res.status(200).json(benchmark);
  } catch (error) {
    console.error("Error fetching benchmark:", error);
    res.status(500).json({ 
      message: "Error fetching benchmark", 
      error: error.message 
    });
  }
};

// CREATE a new benchmark for a unit
exports.createBenchmark = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { unitId, ...benchmarkData } = req.body;

    // Validate unit exists
    const unit = await Unit.findByPk(unitId, { transaction });
    if (!unit) {
      await transaction.rollback();
      return res.status(404).json({ message: "Unit not found" });
    }

    // Validate benchmarkRef is unique for this unit
    const existingWithSameRef = await Benchmark.findOne({
      where: {
        unitId,
        benchmarkRef: benchmarkData.benchmarkRef
      },
      transaction
    });

    if (existingWithSameRef) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: "Benchmark reference already exists for this unit",
        suggestion: "Use a unique benchmarkRef for each unit"
      });
    }

    const newBenchmark = await Benchmark.create({
      unitId,
      ...benchmarkData
    }, { transaction });

    await transaction.commit();
    
    // Fetch the newly created benchmark with unit info
    const createdBenchmark = await Benchmark.findByPk(newBenchmark.id, {
      include: [{
        model: Unit,
        as: "unit",
        attributes: ['id', 'unitId', 'unitName']
      }]
    });

    res.status(201).json(createdBenchmark);
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating benchmark:", error);
    res.status(500).json({ 
      message: "Error creating benchmark", 
      error: error.message,
      details: error.errors?.map(err => err.message) // Include validation errors if any
    });
  }
};

// UPDATE a benchmark
exports.updateBenchmark = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { unitId, benchmarkRef, ...updateData } = req.body;

    const benchmark = await Benchmark.findByPk(id, { transaction });
    if (!benchmark) {
      await transaction.rollback();
      return res.status(404).json({ message: "Benchmark not found" });
    }

    // If changing benchmarkRef, validate it's unique for the unit
    if (benchmarkRef && benchmarkRef !== benchmark.benchmarkRef) {
      const existingWithSameRef = await Benchmark.findOne({
        where: {
          unitId: benchmark.unitId,
          benchmarkRef
        },
        transaction
      });

      if (existingWithSameRef) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: "Benchmark reference already exists for this unit",
          suggestion: "Use a unique benchmarkRef for each unit"
        });
      }
    }

    await benchmark.update({
      benchmarkRef: benchmarkRef || benchmark.benchmarkRef,
      ...updateData
    }, { transaction });

    await transaction.commit();
    
    // Fetch updated benchmark with unit info
    const updatedBenchmark = await Benchmark.findByPk(id, {
      include: [{
        model: Unit,
        as: "unit",
        attributes: ['id', 'unitId', 'unitName']
      }]
    });

    res.status(200).json(updatedBenchmark);
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating benchmark:", error);
    res.status(500).json({ 
      message: "Error updating benchmark", 
      error: error.message,
      details: error.errors?.map(err => err.message)
    });
  }
};

// DELETE a benchmark
exports.deleteBenchmark = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;

    const benchmark = await Benchmark.findByPk(id, { transaction });
    if (!benchmark) {
      await transaction.rollback();
      return res.status(404).json({ message: "Benchmark not found" });
    }

    await benchmark.destroy({ transaction });
    await transaction.commit();

    res.status(200).json({ 
      message: "Benchmark deleted successfully",
      deletedBenchmarkId: id
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting benchmark:", error);
    res.status(500).json({ 
      message: "Error deleting benchmark", 
      error: error.message,
      suggestion: "Check if there are any dependencies preventing deletion"
    });
  }
};

