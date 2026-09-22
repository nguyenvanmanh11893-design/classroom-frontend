import * as z from "zod";

export const facultySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    role: z.enum(["admin", "teacher", "student"], {
        required_error: "Please select a role",
    }),
    department: z.string(),
    image: z.string().optional(),
    imageCldPubId: z.string().optional(),
});

export const subjectSchema = z.object({
    name: z.string().min(3, "Subject name must be at least 3 characters"),
    code: z.string().min(5, "Subject code must be at least 5 characters"),
    description: z
        .string()
        .min(5, "Subject description must be at least 5 characters"),
    department: z
        .string()
        .min(2, "Subject department must be at least 2 characters"),
});

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const scheduleSchema = z.object({
    dayOfWeek: z.coerce.number().int().min(1).max(7),
    startTime: time,
    endTime: time,
}).refine(s => s.startTime < s.endTime, { path: ['endTime'], message: 'End time must follow start time' });

export const classSchema = z.object({
    name: z.string().trim().min(2).max(255),
    description: z.string().max(5000).optional(),
    subjectId: z.coerce.number().int().positive(),
    semesterId: z.coerce.number().int().positive(),
    teacherId: z.string().min(1),
    capacity: z.coerce.number().int().positive().max(100000),
    lifecycleStatus: z.enum(['draft', 'open', 'closed', 'completed', 'cancelled']),
    bannerUrl: z.string().url().max(2000).optional(),
    bannerCldPubId: z.string().max(500).optional(),
    schedules: z.array(scheduleSchema).max(14),
}).strict();

export const enrollmentSchema = z.object({
    classId: z.coerce
        .number({
            required_error: "Class ID is required",
            invalid_type_error: "Class ID is required",
        })
        .min(1, "Class ID is required"),
    studentId: z.string().min(1, "Student ID is required"),
});