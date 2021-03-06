import { startOfHour, isBefore, getHours } from 'date-fns';

import { injectable, inject } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Appointment from '../infra/typeorm/entities/Appointment';

import IAppointmentsRepository from '../repositories/IAppointmentsRepository';

/**
 *
 * [x] Information reception
 * [/] Errors/Exceptions
 * [x] Repository access
 */

interface IRequest {
    provider_id: string;
    user_id: string;
    date: Date;
}

/**
 *
 * Dependency inversion (SOLID)
 *
 * if serves has an external dependency (eg. repositories)
 * We should not make another repository in the class.
 * Instead, we should receive the repository in the class and return it.
 *
 */

@injectable()
class CreateAppointmentService {
    // private in the construction creates the variable

    constructor(
        @inject('AppointmentsRepository')
        private appointmentsRepository: IAppointmentsRepository,
    ) {
        this.appointmentsRepository = appointmentsRepository;
    }

    public async execute({
        date,
        provider_id,
        user_id,
    }: IRequest): Promise<Appointment> {
        // startOfHour brings the Data object back to the hour beguin
        const appointmentDate = startOfHour(date);

        if (user_id === provider_id) {
            throw new AppError("You can't create an appointment with yourself");
        }

        if (isBefore(appointmentDate, Date.now())) {
            throw new AppError(
                "You can't create an appointment on a past date",
            );
        }

        if (getHours(appointmentDate) < 8 || getHours(appointmentDate) > 17) {
            throw new AppError(
                'You can only create appointments between 8am and 17pm',
            );
        }

        const findAppointmentInSameDate = await this.appointmentsRepository.findByDate(
            appointmentDate,
        );

        if (findAppointmentInSameDate) {
            throw new AppError('This appointment is already booked');
        }

        const appointment = await this.appointmentsRepository.create({
            provider_id,
            user_id,
            date: appointmentDate,
        });

        return appointment;
    }
}
export default CreateAppointmentService;
