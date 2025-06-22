document.addEventListener('DOMContentLoaded', async () => {
    const res = await fetch('/api/children');
    const children = await res.json();
    let currentIndex = 0;
    //obtine referinte catre elementele HTML cheie
    const nameEl = document.getElementById('child-name');
    const ageEl = document.getElementById('child-age');
    const prevBtn = document.getElementById('prev-child');
    const nextBtn = document.getElementById('next-child');
    const addBtn = document.getElementById('btn-add-child');
    const delBtn = document.getElementById('btn-delete-child');

    // link-uri rapide
    const feedingLink = document.getElementById('link-feeding');
    const sleepLink = document.getElementById('link-sleep');
    const medicalLink = document.getElementById('link-medical');
    const navTimelineLink = document.querySelector('a.navbar-link[href="/timeline"]');

    // functie pentru a afisa informatiile copilului curent
    function renderChild() {
        if (!children.length) {
            nameEl.textContent = 'Niciun copil';
            ageEl.textContent = '';
            prevBtn.disabled = nextBtn.disabled = delBtn.disabled = true;
            return;
        }
        const child = children[currentIndex];
        nameEl.textContent = child.name;

        // calcul ani si luni (varsta copilului)
        const dob = new Date(child.date_of_birth);
        const now = new Date();
        let years = now.getFullYear() - dob.getFullYear();
        let months = now.getMonth() - dob.getMonth();
        if (months < 0) {
            years--;
            months += 12;
        }
        const aniText = years === 1 ? '1 an' : `${years} ani`;
        const luniText = months === 1 ? '1 lună' : `${months} luni`;
        ageEl.textContent = `Vârstă: ${aniText} și ${luniText}`;

        // actualizeaza quick-links
        feedingLink.href = `/calendar?child=${child.id}&type=feeding`;
        sleepLink.href = `/calendar?child=${child.id}&type=sleep`;
        medicalLink.href = `/calendar?child=${child.id}&type=medical`;

        // actualizeaza si link-ul nav catre timeline
        if (navTimelineLink) {
            navTimelineLink.setAttribute('href', `/timeline?child=${child.id}`);
        }

        prevBtn.disabled = nextBtn.disabled = delBtn.disabled = false;
    }
    //sageata prev
    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + children.length) % children.length;
        renderChild();
    });
    //sageata next
    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % children.length;
        renderChild();
    });
    //adauga copil
    addBtn.addEventListener('click', async () => {
        const name = prompt('Nume copil:');
        const dob = prompt('Data naștere (YYYY-MM-DD):');
        if (name && dob) {
            await fetch('/api/children', {
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: `name=${encodeURIComponent(name)}&dob=${encodeURIComponent(dob)}`,
            });
            location.reload();
        }
    });
    // sterge copil
    delBtn.addEventListener('click', async () => {
        if (!children.length) return;
        const child = children[currentIndex];
        if (confirm(`Stergi copilul ${child.name}?`)) {
            await fetch(`/api/children/${child.id}`, {method: 'DELETE'});
            location.reload();
        }
    });

    // logout
    document.getElementById('btn-logout').addEventListener('click', () => {
        window.location.href = '/logout';
    });


    // initalizare
    renderChild();
});
