document.addEventListener('DOMContentLoaded', async () => {
    // colecteaza referinte catre elementele UI din pagina
    const childSelect = document.getElementById('child-select');
    const typeSelect = document.getElementById('type-select');
    const addBtn = document.getElementById('btn-add-event');
    const cancelBtn = document.getElementById('cancel-event');
    const form = document.getElementById('add-event-form');
    const eventList = document.getElementById('event-list');
    const evtChild = document.getElementById('evt-child');
    const evtDate = document.getElementById('evt-date');
    const evtTime = document.getElementById('evt-time');
    const evtNotes = document.getElementById('evt-notes');
    const evtRepeat = document.getElementById('evt-repeat');
    const calendarEl = document.getElementById('calendar');
    const prevMonth = document.getElementById('prev-month');
    const nextMonth = document.getElementById('next-month');
    const currentMonthEl = document.getElementById('current-month');

    // lista copii
    const resCh = await fetch('/api/children');
    const children = await resCh.json();
    children.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        childSelect.appendChild(opt);
    });
    // seteaza copilul selectat initial in formular
    evtChild.value = childSelect.value;

    // === incepe bloc URL-params ===

    // Verifica daca exista parametrii 'child' sau 'type' in URL
    const params = new URLSearchParams(window.location.search);
    const urlChild = params.get('child');
    const urlType = params.get('type');
    if (urlChild && children.some(c => String(c.id) === urlChild)) {
        childSelect.value = urlChild;
        evtChild.value = urlChild;
    }
    if (urlType && ['feeding', 'sleep', 'medical'].includes(urlType)) {
        typeSelect.value = urlType;
    }
    // === sfarsit bloc URL-params ===

    // stare calendar
    let viewDate = new Date();
    let selectedDate = null;

    function formatMonthYear(date) {
        return date.toLocaleString('ro-RO', {month: 'long', year: 'numeric'});
    }

    function renderCalendar(events) {
        calendarEl.innerHTML = '';
        currentMonthEl.textContent = formatMonthYear(viewDate);

        ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'].forEach(d => {
            const el = document.createElement('div');
            el.textContent = d;
            el.className = 'day-name';
            calendarEl.appendChild(el);
        });

        const year = viewDate.getFullYear(), month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay(), offset = (firstDay + 6) % 7;
        // zile disabled
        for (let i = 0; i < offset; i++) {
            const cell = document.createElement('div');
            cell.className = 'day-cell disabled';
            calendarEl.appendChild(cell);
        }
        // adauga celulele pentru zilele lunii curente
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const cell = document.createElement('div');
            cell.textContent = d;
            cell.className = 'day-cell';
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            if (events.some(ev => ev.date === dateStr)) cell.classList.add('has-event');
            if (dateStr === selectedDate) cell.classList.add('selected');
            cell.addEventListener('click', () => {
                if (cell.classList.contains('disabled')) return;
                selectedDate = dateStr;
                form.style.display = 'block';
                evtDate.value = dateStr;
                loadEvents();  // reincarca si lista evenimentelor pentru ziua selectata
            });
            calendarEl.appendChild(cell);
        }
    }
// incarca evenimentele de la API si actualizeaza calendarul si lista de evenimente
    async function loadEvents() {
        const childId = childSelect.value, type = typeSelect.value;
        evtChild.value = childId;
        const res = await fetch(`/api/events?child=${childId}&type=${type}`);
        const events = await res.json();
        renderCalendar(events);

        // afisam doar evenimentele din selectedDate
        eventList.innerHTML = '';
        if (selectedDate) {
            events
                .filter(ev => ev.date === selectedDate)
                .forEach(ev => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${ev.date} ${ev.time}</strong> – ${ev.notes || '(fără notițe)'}
            <button class="delete-event" data-id="${ev.id}">×</button>`;
                    li.querySelector('.delete-event').onclick = async () => {
                        await fetch(`/api/events/${ev.id}`, {method: 'DELETE'});
                        loadEvents();
                    };
                    eventList.appendChild(li);
                });
        }
    }

    // UI events
    childSelect.onchange = () => {
        selectedDate = null;
        loadEvents();
    };
    typeSelect.onchange = () => {
        selectedDate = null;
        loadEvents();
    };
    prevMonth.onclick = () => {
        viewDate.setMonth(viewDate.getMonth() - 1);
        selectedDate = null;
        loadEvents();
    };
    nextMonth.onclick = () => {
        viewDate.setMonth(viewDate.getMonth() + 1);
        selectedDate = null;
        loadEvents();
    };

    addBtn.onclick = () => form.style.display = 'block';
    cancelBtn.onclick = () => {
        form.reset();
        form.style.display = 'none';
    };
    form.onsubmit = async e => {
        e.preventDefault(); // impiedica reincarcarea paginii
        const start = new Date(evtDate.value), repeatDays = parseInt(evtRepeat.value) || 0;
        for (let i = 0; i <= repeatDays; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const dateStr = d.toISOString().slice(0, 10);
            await fetch('/api/events', { // trimite cerere POST la API pentru a crea evenimentul
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: `child=${encodeURIComponent(evtChild.value)}&date=${encodeURIComponent(dateStr)}&time=${encodeURIComponent(evtTime.value)}&type=${encodeURIComponent(typeSelect.value)}&notes=${encodeURIComponent(evtNotes.value)}`
            });
        }
        form.style.display = 'none';
        loadEvents();
    };

    // apel inițial pt afisarea ev curente
    loadEvents();
});
