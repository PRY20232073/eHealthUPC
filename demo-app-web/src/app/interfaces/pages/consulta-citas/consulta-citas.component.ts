import {
  Component,
  ViewChild,
  TemplateRef,
  signal,
  Signal,
  ChangeDetectorRef,
} from '@angular/core';
import {
  CalendarOptions,
  DateSelectArg,
  EventClickArg,
  EventApi,
  EventInput,
  DateInput,
} from '@fullcalendar/core'; // useful for typechecking
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import esLocale from '@fullcalendar/core/locales/es';
import { INITIAL_EVENTS, createEventId } from '../../utils/cita-utils';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-consulta-citas',
  templateUrl: './consulta-citas.component.html',
  styleUrls: ['./consulta-citas.component.css'],
})
export class ConsultaCitasComponent {
  calendarVisible = signal(true);
  @ViewChild('appointmentDetailsModal')
  appointmentDetailsModal!: TemplateRef<any>; // Referencia al modal
  calendarOptions = signal<CalendarOptions>({
    initialView: 'dayGridMonth',
    themeSystem: 'bootstrap5',
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    locale: esLocale,
    //dateClick: this.handleDateClick.bind(this), // MUST ensure `this` context is maintained
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },
    // events: [
    //   { title: 'event 1', date: '2023-11-01' },
    //   { title: 'event 2', date: '2023-11-01' },
    // ],
    initialEvents: INITIAL_EVENTS, // alternatively, use the `events` setting to fetch from a feed
    eventColor: '#D50000',
    weekends: true,
    editable: false,
    selectable: true,
    selectMirror: false,
    dayMaxEvents: false,
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventsSet: this.handleEvents.bind(this),
  });
  selectedDate: Date | null = null; // Almacena la fecha seleccionada
  selectedAppointments: EventInput[] = []; // Almacena las citas seleccionadas
  //currentEvents: Signal<EventApi[]> = signal([]);
  // handleDateClick(arg: any) {
  //   console.log('date click! ' + arg.dateStr);
  // }
  doctor = '';
  especialidad = '';
  sintomas = '';
  fecha_cita = '';
  dataSource = [
    { label: 'Doctor', value: this.doctor },
    {
      label: 'Especialidad',
      value: this.especialidad,
    },
    {
      label: 'Sintomas',
      value: this.sintomas,
    },
  ];
  constructor(
    private changeDetector: ChangeDetectorRef,
    private datePipe: DatePipe,
    private dialog: MatDialog
  ) {}
  openAppointmentDetailsModal(appointment: any) {
    console.log(appointment);
    const fecha_cita_aux = this.datePipe
      .transform(appointment.start, 'dd/MM/yyyy hh:mm a')
      ?.toString();
    if (fecha_cita_aux) this.fecha_cita = fecha_cita_aux;
    this.dataSource = [
      { label: 'Doctor', value: appointment.doctor },
      {
        label: 'Especialidad',
        value: appointment.especialidad,
      },
      {
        label: 'Sintomas',
        value: appointment.sintomas,
      },
      {
        label: 'Fecha de la cita',
        value: this.fecha_cita,
      },
    ];
    this.dialog.open(this.appointmentDetailsModal, {
      width: '500px',
      data: appointment,
      autoFocus: false,
    });
  }
  closeDetailsModal() {
    this.dialog.closeAll();
  }
  ngOnInit() {
    this.loadDailyAppointments();
  }
  loadDailyAppointments() {
    // // Obtén eventos de hoy y actuliza currentEvents
    const dailyAppointments = this.getDailyAppointments(new Date());
    // this.currentEvents.update(() => dailyAppointments);
    //this.calendarOptions.set({ events: dailyAppointments });
    const hoy = new Date();
    this.selectedDate = hoy;
    this.selectedAppointments = this.getDailyAppointments(hoy);
  }
  handleCalendarToggle() {
    this.calendarVisible.update((bool) => !bool);
  }

  handleWeekendsToggle() {
    this.calendarOptions.mutate((options) => {
      options.weekends = !options.weekends;
    });
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    //const title = prompt('Please enter a new title for your event');
    const calendarApi = selectInfo.view.calendar;
    this.selectedDate = selectInfo.start;

    this.selectedAppointments = this.getDailyAppointments(this.selectedDate);
    calendarApi.unselect(); // clear date selection

    // if (title) {
    //   calendarApi.addEvent({
    //     id: createEventId(),
    //     title,
    //     start: selectInfo.startStr,
    //     end: selectInfo.endStr,
    //     allDay: selectInfo.allDay,
    //   });
    // }
  }

  handleEventClick(clickInfo: EventClickArg) {
    this.doctor = clickInfo.event.extendedProps['doctor'];
    this.especialidad = clickInfo.event.extendedProps['especialidad'];
    this.sintomas = clickInfo.event.extendedProps['sintomas'];

    const fecha_cita_aux = this.datePipe
      .transform(clickInfo.event.start, 'dd/MM/yyyy hh:mm a')
      ?.toString();
    if (fecha_cita_aux) this.fecha_cita = fecha_cita_aux;
    this.dataSource = [
      { label: 'Doctor', value: this.doctor },
      {
        label: 'Especialidad',
        value: this.especialidad,
      },
      {
        label: 'Sintomas',
        value: this.sintomas,
      },
      {
        label: 'Fecha de la cita',
        value: this.fecha_cita,
      },
    ];
    this.openAppointmentDetailsModal(clickInfo.event.extendedProps);
    // if (
    //   confirm(
    //     `Are you sure you want to delete the event '${clickInfo.event.title}'`
    //   )
    // ) {
    //   clickInfo.event.remove();
    // }
  }

  handleEvents(events: EventApi[]) {
    //this.currentEvents.set(events);
    this.changeDetector.detectChanges(); // workaround for pressionChangedAfterItHasBeenCheckedError
  }

  getDailyAppointments(date: Date): EventInput[] {
    const dateStr = date.toISOString().split('T')[0];
    return INITIAL_EVENTS.filter((event) => {
      let eventStart: Date | undefined;

      if (typeof event.start === 'string') {
        eventStart = new Date(event.start);
      } else if (typeof event.start === 'number') {
        eventStart = new Date(event.start);
      } else if (event.start instanceof Date) {
        eventStart = event.start;
      }

      return (
        eventStart &&
        this.datePipe.transform(eventStart, 'yyyy-MM-dd') === dateStr
      );
    });
  }
  formatDate(date: DateInput | undefined): string {
    if (!date) {
      return ''; // Otra cadena predeterminada o manejo de caso nulo
    }

    // Convierte 'date' a una cadena si no lo es
    const dateString = typeof date === 'string' ? date : date.toString();

    const parsedDate = new Date(dateString);

    if (isNaN(parsedDate.getTime())) {
      return ''; // Manejo del caso en que 'date' no es una fecha válida
    }

    return this.datePipe.transform(parsedDate, 'hh:mm a') || '';
  }
}
