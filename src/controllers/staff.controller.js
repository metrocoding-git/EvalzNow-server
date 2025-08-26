const db = require('../models');
const Staff = db.Staff;

// GET all Staff
exports.getStaff = async (req, res) => {
    try {
      const staffs = await Staff.findAll();
      res.status(200).json(staffs);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching clients', error: error.message });
    }
};


// GET staff by ID
exports.getStaffById = async (req, res) => {
    try {
      const staff = await Staff.findByPk(req.params.id);
      if (!staff) return res.status(404).json({ message: 'Staff not found' });
      res.status(200).json(staff);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching staff', error: error.message });
    }
  };
  
  // CREATE new staff
  exports.createStaff = async (req, res) => {
    try {
      const newStaff = await Staff.create(req.body);
      res.status(201).json(newStaff);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error creating staff', error: error.message });
    }
  };
  
  // UPDATE existing staff
  exports.updateStaff = async (req, res) => {
    try {
      const staff = await Staff.findByPk(req.params.id);
      if (!staff) return res.status(404).json({ message: 'Staff not found' });
  
      await staff.update(req.body);
      res.status(200).json(staff);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating staff', error: error.message });
    }
  };
  
  // DELETE staff
  exports.deleteStaff = async (req, res) => {
    try {
      const staff = await Staff.findByPk(req.params.id);
      if (!staff) return res.status(404).json({ message: 'Staff not found' });
  
      await staff.destroy();
      res.status(200).json({ message: 'Staff deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error deleting staff', error: error.message });
    }
  };