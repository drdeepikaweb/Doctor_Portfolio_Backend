import { prisma } from "../database/prisma.js";
import { sendClinicEmail } from "../services/email.service.js";
export async function createAppointment(req, res) {
    const appointment = await prisma.appointment.create({
        data: {
            patient_name: req.body.patient_name,
            phone: req.body.phone,
            email: req.body.email || null,
            preferred_date: req.body.preferred_date,
            message: req.body.message,
        },
    });
    await sendClinicEmail("New appointment request", `<h2>New Appointment</h2><p><strong>Name:</strong> ${appointment.patient_name}</p><p><strong>Phone:</strong> ${appointment.phone}</p><p><strong>Email:</strong> ${appointment.email || "Not provided"}</p><p><strong>Date:</strong> ${appointment.preferred_date.toDateString()}</p><p>${appointment.message}</p>`);
    res.status(201).json({ message: "Appointment created", appointment });
}
