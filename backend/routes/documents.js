import express from 'express';
import Document from '../models/Document.js';
import Project from '../models/Project.js';
import Twin from '../models/Twin.js';
import { protect } from '../middleware/auth.js';
import { parseDocument } from '../utils/gemini.js';

const router = express.Router();

// @desc    Get all documents
// @route   GET /api/documents
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const documents = await Document.find({}).populate('projectId', 'name');
    res.json(documents);
  } catch (error) {
    console.error('Fetch documents error:', error);
    res.status(500).json({ message: 'Server error fetching documents' });
  }
});

// @desc    Get specific document details
// @route   GET /api/documents/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id).populate('projectId', 'name');
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    console.error('Fetch document error:', error);
    res.status(500).json({ message: 'Server error fetching document details' });
  }
});

// @desc    Upload text-based document & Extract skills/summary via Gemini AI
// @route   POST /api/documents/upload
// @access  Private
router.post('/upload', protect, async (req, res) => {
  const { projectId, fileName, docText } = req.body;

  if (!projectId || !fileName || !docText) {
    return res.status(400).json({ message: 'Please provide projectId, fileName, and docText' });
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    let parsedData = {
      summary: `Document text successfully uploaded. Extraction offline.`,
      extractedSkills: []
    };

    if (process.env.GEMINI_API_KEY) {
      try {
        parsedData = await parseDocument(fileName, docText);
      } catch (err) {
        console.error('Gemini document parsing failed:', err);
      }
    } else {
      // Mock logic: look for words that look like technologies
      const sampleTechs = ['kubernetes', 'react', 'python', 'docker', 'rust', 'go', 'node.js', 'redis', 'security', 'pytorch', 'mlops'];
      const textLower = docText.toLowerCase();
      sampleTechs.forEach(tech => {
        if (textLower.includes(tech)) {
          // Capitalize first letter
          const formatted = tech.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('.');
          parsedData.extractedSkills.push(formatted);
        }
      });
      parsedData.summary = `Mock parsed summary of ${fileName}: Document details architectural standards and dependencies for project ${project.name}.`;
    }

    const document = await Document.create({
      projectId,
      fileName,
      summary: parsedData.summary,
      extractedSkills: parsedData.extractedSkills
    });

    // Auto-update Project skills required based on new document extraction
    if (parsedData.extractedSkills && parsedData.extractedSkills.length > 0) {
      parsedData.extractedSkills.forEach(skill => {
        if (!project.skills.includes(skill)) {
          project.skills.push(skill);
        }
      });
      await project.save();

      // Auto-update Uploader's Twin profile (implies learning from documents uploaded)
      const uploaderTwin = await Twin.findOne({ userId: req.user._id });
      if (uploaderTwin) {
        let skillsAdded = false;
        parsedData.extractedSkills.forEach(skill => {
          if (!uploaderTwin.skills.includes(skill)) {
            uploaderTwin.skills.push(skill);
            skillsAdded = true;
          }
        });
        if (skillsAdded) {
          await uploaderTwin.save();
        }
      }
    }

    const populatedDoc = await Document.findById(document._id).populate('projectId', 'name');
    res.status(201).json(populatedDoc);

  } catch (error) {
    console.error('Document upload processing error:', error);
    res.status(500).json({ message: 'Server error processing document', error: error.message });
  }
});

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    await Document.findByIdAndDelete(document._id);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Server error deleting document' });
  }
});

export default router;
