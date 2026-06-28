import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Twin from '../models/Twin.js';
import Project from '../models/Project.js';
import Decision from '../models/Decision.js';
import Meeting from '../models/Meeting.js';
import Review from '../models/Review.js';
import Task from '../models/Task.js';
import Document from '../models/Document.js';
import ApprovalRequest from '../models/ApprovalRequest.js';
import AicooLog from '../models/AicooLog.js';

// Resolve current directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedData = async (shouldCloseConnection = false) => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }

    console.log('Connecting to database for seeding...');
    await mongoose.connect(mongoUri);

    console.log('Clearing existing database collections...');
    await User.deleteMany({});
    await Twin.deleteMany({});
    await Project.deleteMany({});
    await Decision.deleteMany({});
    await Meeting.deleteMany({});
    await Review.deleteMany({});
    await Task.deleteMany({});
    await Document.deleteMany({});
    await ApprovalRequest.deleteMany({});
    await AicooLog.deleteMany({});

    console.log('Creating 10 synthetic Users...');
    
    // Hash is handled by User.js pre-save hook, so we just supply plain text 'twinos123'
    const usersData = [
      {
        name: 'Vidhyadhar',
        email: 'vidhyadhar@twinos.com',
        password: 'twinos123',
        role: 'Senior ML Engineer',
        bio: 'Specialist in deep learning, NLP transformers, and clinical RAG pipelines. Enjoys rapid prototyping with FastAPI and LangGraph.',
        availability: 'Available',
        yearsExperience: 6
      },
      {
        name: 'Sarika',
        email: 'sarika@twinos.com',
        password: 'twinos123',
        role: 'Lead Architect',
        bio: 'Systems architect focused on scalable backend microservices, DB optimization, and memory efficiency. Advocate for local caching.',
        availability: 'Focused',
        yearsExperience: 10
      },
      {
        name: 'Rahul',
        email: 'rahul@twinos.com',
        password: 'twinos123',
        role: 'Cloud Architect',
        bio: 'Infrastructure specialist focusing on multi-cloud setups, high-availability clusters, and automated provisioning.',
        availability: 'In Meeting',
        yearsExperience: 8
      },
      {
        name: 'Anjeet',
        email: 'anjeet@twinos.com',
        password: 'twinos123',
        role: 'DevOps Lead',
        bio: 'CI/CD automation expert, Kubernetes cluster wizard, and Prometheus/Grafana monitoring system builder.',
        availability: 'Available',
        yearsExperience: 7
      },
      {
        name: 'Priya',
        email: 'priya@twinos.com',
        password: 'twinos123',
        role: 'Frontend Architect',
        bio: 'UI/UX enthusiast crafting responsive, fast, and gorgeous interfaces using React, Next.js, Tailwind CSS, and Figma.',
        availability: 'Available',
        yearsExperience: 5
      },
      {
        name: 'Aman',
        email: 'aman@twinos.com',
        password: 'twinos123',
        role: 'Product Manager',
        bio: 'Bridging technical architecture and user experience. Specialist in agile methodologies, PRD crafting, and roadmaps.',
        availability: 'In Meeting',
        yearsExperience: 8
      },
      {
        name: 'Riya',
        email: 'riya@twinos.com',
        password: 'twinos123',
        role: 'Backend Engineer',
        bio: 'Pythonista building secure microservices and managing relational/non-relational database architectures.',
        availability: 'Available',
        yearsExperience: 3
      },
      {
        name: 'Karan',
        email: 'karan@twinos.com',
        password: 'twinos123',
        role: 'QA Engineer',
        bio: 'Test automation engineer implementing end-to-end regression tests using Cypress, Jest, and load testing tooling.',
        availability: 'Available',
        yearsExperience: 4
      },
      {
        name: 'Neha',
        email: 'neha@twinos.com',
        password: 'twinos123',
        role: 'Security Engineer',
        bio: 'Securing architectures against OWASP vulnerabilities, setting up IAM, OAuth, pen-testing systems, and security Auditing.',
        availability: 'Focused',
        yearsExperience: 6
      },
      {
        name: 'Akash',
        email: 'akash@twinos.com',
        password: 'twinos123',
        role: 'Data Scientist',
        bio: 'Focusing on health informatics, clinical datasets (MIMIC-IV), clinical trial classification, and PyTorch transformer models.',
        availability: 'Available',
        yearsExperience: 5
      }
    ];

    const users = [];
    for (const u of usersData) {
      const user = new User(u);
      await user.save();
      users.push(user);
    }
    console.log(`Created ${users.length} users successfully.`);

    // Helper map to quickly find user ObjectId by name
    const uMap = {};
    users.forEach(u => {
      uMap[u.name] = u._id;
    });

    console.log('Creating Digital Twins for all 10 users...');
    const twinsData = [
      {
        userId: uMap['Vidhyadhar'],
        skills: ['Python', 'LangGraph', 'RAG', 'MLOps', 'PyTorch', 'FastAPI'],
        expertise: [
          { area: 'Deep Learning', score: 88 },
          { area: 'RAG Architectures', score: 92 },
          { area: 'FastAPI Prototyping', score: 90 }
        ],
        preferences: ['FastAPI', 'Rapid Prototyping', 'Async Python'],
        summary: 'Digital twin of Vidhyadhar. Highly capable in deep learning, vector databases, and constructing LLM-agent workflows using LangGraph and FastAPI.'
      },
      {
        userId: uMap['Sarika'],
        skills: ['Node.js', 'Systems Design', 'Redis', 'MongoDB', 'PostgreSQL', 'Express'],
        expertise: [
          { area: 'Distributed Architectures', score: 95 },
          { area: 'Database Schema Optimization', score: 90 },
          { area: 'Memory Caching Design', score: 94 }
        ],
        preferences: ['Express', 'Clean Architecture', 'Local Memory Caching'],
        summary: 'Digital twin of Sarika. Focuses on systems design, microservices, Express/Mongoose backend pipelines, and high-throughput databases.'
      },
      {
        userId: uMap['Rahul'],
        skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'Linux', 'Ansible'],
        expertise: [
          { area: 'Cloud Computing', score: 90 },
          { area: 'Kubernetes Cluster Provisioning', score: 85 },
          { area: 'Infrastructure as Code', score: 92 }
        ],
        preferences: ['AWS CloudFormation', 'Terraform Modules', 'High Availability'],
        summary: 'Digital twin of Rahul. Infrastructure specialist proficient in Docker containerization, Kubernetes orchestrations, and cloud architecture.'
      },
      {
        userId: uMap['Anjeet'],
        skills: ['Kubernetes', 'CI/CD', 'Terraform', 'Prometheus', 'Grafana', 'GitLab CI'],
        expertise: [
          { area: 'Kubernetes Deployments', score: 92 },
          { area: 'CI/CD Automation Pipelines', score: 90 },
          { area: 'Observability & Monitoring', score: 86 }
        ],
        preferences: ['Helm Charts', 'GitLab Runners', 'PromQL Dashboards'],
        summary: 'Digital twin of Anjeet. Specializes in deployment automation, cluster health, telemetry metrics, and high-frequency deployment environments.'
      },
      {
        userId: uMap['Priya'],
        skills: ['React', 'Next.js', 'Tailwind CSS', 'TypeScript', 'Redux Toolkit', 'Figma'],
        expertise: [
          { area: 'Responsive Web Interfaces', score: 93 },
          { area: 'State Management', score: 88 },
          { area: 'Design Systems Integration', score: 90 }
        ],
        preferences: ['TypeScript', 'Vite Bundler', 'Tailwind CSS UI'],
        summary: 'Digital twin of Priya. Creative frontend engineer developing visually stunning, pixel-perfect, accessible React dashboards.'
      },
      {
        userId: uMap['Aman'],
        skills: ['Product Strategy', 'Agile', 'UX Research', 'Jira', 'Roadmapping'],
        expertise: [
          { area: 'Agile Product Management', score: 90 },
          { area: 'User Research Synthesis', score: 85 }
        ],
        preferences: ['Linear Workflows', 'Scrum Sprint Boards'],
        summary: 'Digital twin of Aman. Bridges product visions with engineering backlogs, ensuring user-centric milestones and feature delivery.'
      },
      {
        userId: uMap['Riya'],
        skills: ['Python', 'Django', 'PostgreSQL', 'Redis', 'Celery', 'REST APIs'],
        expertise: [
          { area: 'Relational DB Architectures', score: 85 },
          { area: 'Background Task Processing', score: 80 }
        ],
        preferences: ['Django REST Framework', 'Celery Queues'],
        summary: 'Digital twin of Riya. Backend developer managing robust APIs, PostgreSQL migrations, and background worker queues.'
      },
      {
        userId: uMap['Karan'],
        skills: ['Selenium', 'Jest', 'Cypress', 'Load Testing', 'Postman', 'QA Automation'],
        expertise: [
          { area: 'E2E Testing Automation', score: 88 },
          { area: 'Performance/Load Testing', score: 82 }
        ],
        preferences: ['Cypress Test Runner', 'Automated QA Pipelines'],
        summary: 'Digital twin of Karan. Quality assurance engineer building comprehensive regression suites and measuring API latency under loads.'
      },
      {
        userId: uMap['Neha'],
        skills: ['Pentesting', 'IAM', 'Cryptography', 'OAuth', 'Security Audits', 'JWT'],
        expertise: [
          { area: 'Application Security Compliance', score: 89 },
          { area: 'Authentication Protocols', score: 92 }
        ],
        preferences: ['JWT Auth', 'OAuth2.0 Grants', 'WAF Rule Sets'],
        summary: 'Digital twin of Neha. Security expert securing backends, configuring access control lists, and performing periodic vulnerability assessments.'
      },
      {
        userId: uMap['Akash'],
        skills: ['PyTorch', 'Pandas', 'Scikit-Learn', 'NLP', 'Data Science', 'HuggingFace'],
        expertise: [
          { area: 'Clinical NLP Models', score: 90 },
          { area: 'Data Pipeline Engineering', score: 86 }
        ],
        preferences: ['Jupyter Notebooks', 'PyTorch Lighting', 'Clinical Transformers'],
        summary: 'Digital twin of Akash. Data scientist analyzing electronic health records (MIMIC-IV) and training domain-specific language models.'
      }
    ];

    const twins = [];
    for (const t of twinsData) {
      // Map relationships - seed a few teammates
      const teammates = users
        .filter(u => u._id.toString() !== t.userId.toString())
        .slice(0, 3)
        .map(u => ({ userId: u._id, type: 'Teammate' }));
      
      const twin = new Twin({
        ...t,
        relationships: teammates,
        expertiseScore: Math.round(t.expertise.reduce((acc, curr) => acc + curr.score, 0) / t.expertise.length)
      });
      await twin.save();
      twins.push(twin);
    }
    console.log(`Created ${twins.length} digital twins successfully.`);

    console.log('Creating Projects...');
    const projectsData = [
      {
        name: 'Atlas',
        description: 'High-throughput system architectural redesign. Focusing on migrating database drivers, setting up optimal caching layers, and establishing deployment pipelines.',
        members: [uMap['Sarika'], uMap['Anjeet'], uMap['Priya'], uMap['Aman'], uMap['Neha']],
        skills: ['Node.js', 'MongoDB', 'Redis', 'Kubernetes', 'CI/CD', 'React', 'Security Audits'],
        status: 'Active'
      },
      {
        name: 'ICU Prediction',
        description: 'Applying NLP models to MIMIC-IV clinical health charts to predict patient mortality and ICU stays dynamically.',
        members: [uMap['Vidhyadhar'], uMap['Riya'], uMap['Akash']],
        skills: ['Python', 'PyTorch', 'Pandas', 'NLP', 'FastAPI', 'PostgreSQL'],
        status: 'Active'
      },
      {
        name: 'TwinOS',
        description: 'AI-Powered Organizational Memory & Digital Twin Network. Enables AICOO coordination, automatic context aggregation, and expert recommendation.',
        members: [uMap['Aman'], uMap['Priya'], uMap['Vidhyadhar']],
        skills: ['React', 'TypeScript', 'Node.js', 'Mongoose', 'Gemini', 'Tailwind CSS'],
        status: 'Active'
      },
      {
        name: 'SkyLink',
        description: 'Automated deployment orchestrator for internal cloud microservices using Terraform modules.',
        members: [uMap['Anjeet'], uMap['Rahul'], uMap['Karan']],
        skills: ['Terraform', 'Kubernetes', 'AWS', 'Docker', 'QA Automation'],
        status: 'Completed'
      },
      {
        name: 'Titan',
        description: 'Data center migration to AWS and security configuration upgrade.',
        members: [uMap['Sarika'], uMap['Rahul'], uMap['Karan'], uMap['Neha']],
        skills: ['AWS', 'Docker', 'Terraform', 'OAuth', 'QA Automation'],
        status: 'On Hold'
      }
    ];

    const projects = [];
    for (const p of projectsData) {
      const proj = new Project(p);
      await proj.save();
      projects.push(proj);
    }
    console.log(`Created ${projects.length} projects successfully.`);

    // Helper maps
    const pMap = {};
    projects.forEach(p => {
      pMap[p.name] = p._id;
    });

    console.log('Creating Decisions (Organizational Memory)...');
    const decisionsData = [
      {
        title: 'Rejected Redis for Caching',
        description: 'Evaluation of Redis as the global caching provider for Project Atlas.',
        reason: 'Local container profiling showed substantial memory overhead (approx 450MB baseline in clustered setup). The architecture board decided to implement an in-memory local cache using Node-Cache directly in the application container to reduce infrastructure costs and latency overhead.',
        projectId: pMap['Atlas'],
        ownerId: uMap['Sarika'],
        impact: 'High'
      },
      {
        title: 'Selected Mongoose over raw MongoDB driver',
        description: 'Selection of ORM/ODM layer for MongoDB interaction in Atlas backend.',
        reason: 'Needed robust schema validation, middleware hooks (for automatic change auditing and digital twin event updates), and simple reference populations. Raw driver led to too much boilerplate code in endpoints.',
        projectId: pMap['Atlas'],
        ownerId: uMap['Sarika'],
        impact: 'Medium'
      },
      {
        title: 'Approved PyTorch for Model Prototyping',
        description: 'Choice of core neural network library for clinical transformer training.',
        reason: 'PyTorch provides superior interactive debugging, easier integration with HuggingFace clinical pipelines, and a wider selection of pre-trained clinical embedding models in literature.',
        projectId: pMap['ICU Prediction'],
        ownerId: uMap['Akash'],
        impact: 'High'
      }
    ];

    const decisions = [];
    for (const d of decisionsData) {
      const dec = new Decision(d);
      await dec.save();
      decisions.push(dec);
    }
    console.log(`Created ${decisions.length} decisions successfully.`);

    console.log('Creating Meetings...');
    const meetingsData = [
      {
        projectId: pMap['Atlas'],
        title: 'Atlas Cache Strategy Sync',
        summary: 'Reviewed options for Cache layer. Sarika presented container memory logs. Decided to reject Redis due to high baseline memory overhead in Docker. Action Items: Anjeet to implement memory caching using node-cache, Neha to review access controls.',
        actionItems: [
          { task: 'Implement local caching module with node-cache', ownerId: uMap['Anjeet'] },
          { task: 'Review cache access controls and security', ownerId: uMap['Neha'] }
        ],
        risks: ['Cache invalidation lag might trigger stale data read', 'Local cache increases app memory consumption'],
        participants: [uMap['Sarika'], uMap['Anjeet'], uMap['Neha']]
      },
      {
        projectId: pMap['ICU Prediction'],
        title: 'MIMIC-IV Data Integration Kickoff',
        summary: 'Met to align on clinical datasets. Akash proposed using PyTorch clinical transformers. Vidhyadhar discussed setting up the MLOps pipeline using FastAPI. Action Items: Vidhyadhar to set up git repo, Riya to write data loaders.',
        actionItems: [
          { task: 'Initialize project structure and MLOps scripts', ownerId: uMap['Vidhyadhar'] },
          { task: 'Write MIMIC-IV CSV parsing script and dataset loaders', ownerId: uMap['Riya'] }
        ],
        risks: ['High variability in dataset structure between MIMIC-III and MIMIC-IV', 'GPU compute allocation limits'],
        participants: [uMap['Vidhyadhar'], uMap['Riya'], uMap['Akash']]
      }
    ];

    const meetings = [];
    for (const m of meetingsData) {
      const meet = new Meeting(m);
      await meet.save();
      meetings.push(meet);
    }
    console.log(`Created ${meetings.length} meetings successfully.`);

    console.log('Creating Tasks...');
    const tasksData = [
      {
        title: 'Implement local caching module with node-cache',
        description: 'Create a wrapper for node-cache to perform in-memory key-value lookups in Atlas.',
        ownerId: uMap['Anjeet'],
        projectId: pMap['Atlas'],
        status: 'Completed',
        deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Review cache access controls and security',
        description: 'Verify cached elements do not leak tenant-scoped information.',
        ownerId: uMap['Neha'],
        projectId: pMap['Atlas'],
        status: 'In Progress',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Initialize project structure and MLOps scripts',
        description: 'Configure standard environment, Dockerfile, and FastAPI routes for serving ICU models.',
        ownerId: uMap['Vidhyadhar'],
        projectId: pMap['ICU Prediction'],
        status: 'In Progress',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Set up UI shell and styling variables',
        description: 'Initialize design system CSS tokens and core navigation component.',
        ownerId: uMap['Priya'],
        projectId: pMap['TwinOS'],
        status: 'Completed',
        deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];

    for (const t of tasksData) {
      await new Task(t).save();
    }
    console.log('Created tasks successfully.');

    console.log('Creating Reviews...');
    const reviewsData = [
      {
        reviewerId: uMap['Anjeet'],
        projectId: pMap['SkyLink'],
        expertiseArea: 'Kubernetes Helm Chart Deployment',
        rating: 5
      },
      {
        reviewerId: uMap['Sarika'],
        projectId: pMap['Atlas'],
        expertiseArea: 'Distributed Caching Infrastructure',
        rating: 4
      }
    ];

    for (const r of reviewsData) {
      await new Review(r).save();
    }
    console.log('Created reviews successfully.');

    console.log('Creating Approval Requests (AICOO Human Loop)...');
    const approvalsData = [
      {
        type: 'Assign Reviewer',
        status: 'Pending',
        details: {
          projectId: pMap['Atlas'],
          projectName: 'Atlas',
          architectureDescription: 'Reviewing setup for Kubernetes multi-node pods ingress configuration.',
          candidates: [
            { reviewerId: uMap['Anjeet'], name: 'Anjeet', confidenceScore: 92, reason: 'Kubernetes deployment specialist' },
            { reviewerId: uMap['Rahul'], name: 'Rahul', confidenceScore: 88, reason: 'Cloud architect with K8s experience' }
          ]
        },
        requesterId: uMap['Sarika']
      },
      {
        type: 'Create Decision',
        status: 'Approved',
        details: {
          projectId: pMap['Atlas'],
          projectName: 'Atlas',
          title: 'Selected Mongoose over raw MongoDB driver',
          description: 'Selection of ORM/ODM layer for MongoDB.',
          reason: 'Needed validation schemas and middlewares.',
          impact: 'Medium',
          ownerId: uMap['Sarika']
        },
        requesterId: uMap['Sarika']
      }
    ];

    for (const app of approvalsData) {
      await new ApprovalRequest(app).save();
    }
    console.log('Created approval requests successfully.');

    console.log('Creating AICOO Agent logs...');
    const aicooLogsData = [
      {
        type: 'A2A Negotiation',
        senderId: uMap['Sarika'],
        receiverId: uMap['Anjeet'],
        message: 'Sarika Twin initiated request: Looking for an expert in Kubernetes ingress setups for Atlas project. Recommended candidate found: Anjeet (92% fit).',
        details: { fitScore: 92, criteria: ['Kubernetes', 'DevOps'] }
      },
      {
        type: 'Context Sync',
        senderId: uMap['Vidhyadhar'],
        receiverId: uMap['Akash'],
        message: 'Vidhyadhar Twin synced workspace context with Akash Twin regarding PyTorch pipeline configuration for MIMIC-IV training.',
        details: { syncedFiles: ['dataset_loaders.py', 'model.py'] }
      },
      {
        type: 'Routing',
        senderId: uMap['Aman'],
        receiverId: uMap['Priya'],
        message: 'Aman Twin routed UI requirement task "Set up UI shell and styling variables" to Priya Twin (90% fit).',
        details: { taskName: 'UI shell configuration' }
      }
    ];

    for (const log of aicooLogsData) {
      await new AicooLog(log).save();
    }
    console.log('Created AICOO Agent logs successfully.');

    console.log('Database seeded successfully!');
    if (shouldCloseConnection) {
      await mongoose.connection.close();
      console.log('Database connection closed.');
    }
  } catch (error) {
    console.error('Seeding failed:', error);
    if (shouldCloseConnection) {
      try {
        await mongoose.connection.close();
      } catch (_) {}
      process.exit(1);
    }
    throw error;
  }
};

// If executing directly, run seed
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedData(true);
}

export default seedData;
