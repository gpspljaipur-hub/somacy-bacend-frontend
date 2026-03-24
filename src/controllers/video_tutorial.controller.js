const tutorialModel = require("../models/video_tutorial.model");

// ADD TUTORIAL
const addTutorial = async (req, res) => {
    try {
        const { title, subtitle, video_link, duration, status } = req.body;
        if (!title || !video_link) return res.status(400).json({ status: 0, message: "Title and video link are required" });

        const thumbnail = req.file ? `/uploads/tutorials/${req.file.filename}` : null;

        const data = await tutorialModel.addTutorial({
            title,
            subtitle,
            thumbnail,
            video_link,
            duration,
            status
        });

        res.status(201).json({ status: 1, message: "Video tutorial added successfully", data });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// GET TUTORIALS
const getTutorials = async (req, res) => {
    try {
        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 20;
        const status = req.body.status !== undefined ? Number(req.body.status) : null;
        const offset = (page - 1) * limit;

        const data = await tutorialModel.getAllTutorials(limit, offset, status);
        const total = await tutorialModel.countTutorials(status);

        res.json({ status: 1, message: "Video tutorials fetched successfully", total_count: total, data });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// UPDATE TUTORIAL
const updateTutorial = async (req, res) => {
    try {
        const { id, title, subtitle, video_link, duration, status } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "Tutorial ID is required" });

        const updatedData = {
            title: title !== undefined ? title : undefined,
            subtitle: subtitle !== undefined ? subtitle : undefined,
            video_link: video_link !== undefined ? video_link : undefined,
            duration: duration !== undefined ? duration : undefined,
            status: status !== undefined ? Number(status) : undefined
        };

        if (req.file) {
            updatedData.thumbnail = `/uploads/tutorials/${req.file.filename}`;
        }

        const updated = await tutorialModel.updateTutorial(id, updatedData);

        res.json({ status: 1, message: "Video tutorial updated successfully", data: updated });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// DELETE TUTORIAL
const deleteTutorial = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "Tutorial ID is required" });
        await tutorialModel.deleteTutorial(id);
        res.json({ status: 1, message: "Video tutorial(s) deleted successfully" });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

module.exports = {
    addTutorial,
    getTutorials,
    updateTutorial,
    deleteTutorial
};
