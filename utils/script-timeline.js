document.addEventListener('DOMContentLoaded', async () => {
    const childSelect = document.getElementById('child-select');
    const tlList = document.getElementById('timeline-list');
    const exportJson = document.getElementById('export-json');
    const exportCsv = document.getElementById('export-csv');
    const importJson = document.getElementById('import-json');
    const addBtn = document.getElementById('btn-add-timeline-event');
    const form = document.getElementById('add-tl-form');
    const cancelBtn = document.getElementById('cancel-tl');
    const tlDate = document.getElementById('tl-date');
    const tlName = document.getElementById('tl-name');
    const tlDesc = document.getElementById('tl-desc');

    // incarca lista de copii
    const resCh = await fetch('/api/children');
    if (!resCh.ok) {
        alert('Nu am putut incarca lista de copii.');
        return;
    }
    const children = await resCh.json();
    children.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        childSelect.appendChild(opt);
    });

    // dacă exista ?child= în URL, selecteaza-l
    const params = new URLSearchParams(window.location.search);
    const urlChildId = params.get('child');
    if (urlChildId && [...childSelect.options].some(o => o.value === urlChildId)) {
        childSelect.value = urlChildId;
    }

    // 3) Functie de incarcare & afisare evenimente
    async function loadTimeline() {
        const cid = childSelect.value;
        const res = await fetch(`/api/timeline?child=${cid}`);
        if (!res.ok) {
            alert('Eroare la incarcarea evenimentelor.');
            return;
        }
        const events = await res.json();
        tlList.innerHTML = '';
        events.forEach(ev => {
            const li = document.createElement('li');
            li.innerHTML = `
        <div><strong>${ev.date}</strong></div>
        <div>${ev.name}</div>
        <div>${ev.notes || ''}</div>
        <button class="delete-tl-btn" data-id="${ev.id}">Șterge</button>
      `;
            li.querySelector('.delete-tl-btn').onclick = async () => {
                if (!confirm(`Stergi evenimentul "${ev.name}"?`)) return;
                const d = await fetch(`/api/timeline/${ev.id}`, {method: 'DELETE'});
                if (d.ok) loadTimeline();
                else alert('Eroare la stergere.');
            };
            tlList.appendChild(li);
        });
    }

    // legare butoane export/import
    exportJson.onclick = () => {
        const cid = childSelect.value;
        window.location.href = `/api/timeline?child=${cid}&format=json`;
    };
    exportCsv.onclick = () => {
        const cid = childSelect.value;
        window.location.href = `/api/timeline?child=${cid}&format=csv`;
    };
    importJson.onchange = async e => {
        const file = e.target.files[0];
        if (!file || !file.name.endsWith('.json')) {
            return alert('Alege un fișier .json.');
        }
        try {
            const text = await file.text();
            const events = JSON.parse(text);
            for (const ev of events) {
                await fetch('/api/timeline', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        child_id: childSelect.value,
                        date: ev.date,
                        name: ev.name,
                        notes: ev.notes || ''
                    })
                });
            }
            loadTimeline();
            alert('Import finalizat cu succes!');
        } catch (err) {
            console.error(err);
            alert('Eroare la import: ' + err.message);
        }
    };

    // legare adauga eveniment
    childSelect.onchange = () => {
        loadTimeline();
        history.replaceState(null, '', `/timeline?child=${childSelect.value}`);
    };
    addBtn.onclick = () => form.style.display = 'block';
    cancelBtn.onclick = () => form.style.display = 'none';
    form.onsubmit = async e => {
        e.preventDefault();
        const body = new URLSearchParams({
            child: childSelect.value,
            date: tlDate.value,
            name: tlName.value,
            notes: tlDesc.value
        });
        const res = await fetch('/api/timeline', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: body.toString()
        });
        if (res.ok) {
            form.style.display = 'none';
            form.reset();
            loadTimeline();
        } else {
            alert('Eroare la adaugare: ' + await res.text());
        }
    };

    // incarca initial
    loadTimeline();
});
