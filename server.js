import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 5000;
let nextPatientId = 4;

let patients = [
	{ id: 1, name: 'Sahith', age: 19, gender: 'male', condition: 'Asthma' },
	{ id: 2, name: 'Ravi Shah', age: 52, gender: 'male', condition: 'Hypertension' },
	{ id: 3, name: 'Mina Patel', age: 27, gender: 'female', condition: 'Migraine' }
];

// Built-in and third-party middleware.
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Application-level request logger.
app.use((req, res, next) => {
	console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
	next();
});

// Middleware functions
function findPatient(req, res, next) {
	const patientId = Number(req.params.id);
	if (!Number.isInteger(patientId) || patientId < 1) {
		return res.status(400).json({ message: 'Patient id must be a positive integer' });
	}

	req.patient = patients.find((patient) => patient.id === patientId);
	if (!req.patient) {
		return res.status(404).json({ message: 'Patient not found' });
	}
	next();
}

function validatePatient(req, res, next) {
	const { name, age, gender, condition } = req.body;
	if (typeof name !== 'string' || !name.trim()) {
		return res.status(400).json({ message: 'name is required and must be a non-empty string' });
	}
	if (!Number.isInteger(age) || age < 0) {
		return res.status(400).json({ message: 'age is required and must be a non-negative integer' });
	}
	if (typeof gender !== 'string' || !gender.trim()) {
		return res.status(400).json({ message: 'gender is required and must be a non-empty string' });
	}
	if (typeof condition !== 'string' || !condition.trim()) {
		return res.status(400).json({ message: 'condition is required and must be a non-empty string' });
	}
	next();
}

// Routes
app.get('/', (req, res) => {
	res.json({ message: 'Patient API is running', endpoints: ['/patients', '/patients/:id', '/patients/condition/:condition'] });
});

// GET 1: all patients.
app.get('/patients', (req, res) => {
	res.json({ count: patients.length, data: patients });
});

// GET 3: patients filtered by condition (Moved up to prevent route conflict).
app.get('/patients/condition/:condition', (req, res, next) => {
	req.condition = req.params.condition.trim().toLowerCase();
	if (!req.condition) {
		return res.status(400).json({ message: 'condition cannot be empty' });
	}
	next();
}, (req, res) => {
	const matches = patients.filter((patient) => patient.condition.toLowerCase() === req.condition);
	res.json({ count: matches.length, data: matches });
});

// GET 2: one patient by id.
app.get('/patients/:id', findPatient, (req, res) => {
	res.json({ data: req.patient });
});

app.post('/patients', validatePatient, (req, res) => {
	const patient = {
		id: nextPatientId++,
		name: req.body.name.trim(),
		age: req.body.age,
		gender: req.body.gender.trim(),
		condition: req.body.condition.trim()
	};
	patients.push(patient);
	res.status(201).json({ message: 'Patient created', data: patient });
});

app.put('/patients/:id', findPatient, validatePatient, (req, res) => {
	Object.assign(req.patient, {
		name: req.body.name.trim(),
		age: req.body.age,
		gender: req.body.gender.trim(),
		condition: req.body.condition.trim()
	});
	res.json({ message: 'Patient updated', data: req.patient });
});

app.delete('/patients/:id', findPatient, (req, res) => {
	patients = patients.filter((patient) => patient.id !== req.patient.id);
	res.json({ message: 'Patient deleted', data: req.patient });
});

// 404 Fallback middleware
app.use((req, res) => {
	res.status(404).json({ message: 'Route not found' });
});

// Centralized error-handling middleware.
app.use((error, req, res, next) => {
	console.error(error.stack || error);
	res.status(error.status || 500).json({
		message: error.status ? error.message : 'Internal server error'
	});
});

app.listen(PORT, () => {
	console.log(`Patient API listening at http://localhost:${PORT}`);
});
