// D:\Web_Tech\bby\utils\script-gallery.js
document.addEventListener('DOMContentLoaded', async () => {
    const els = id => document.getElementById(id);
    const [childTitle, childGrid, familyGrid, childDropdown] =
        ['child-gallery-title', 'child-gallery-grid', 'family-gallery-grid', 'select-child'].map(els);
    const [uploadChild, uploadFamily] =
        ['upload-child-image', 'upload-family-image'].map(els);
    const [childInfo, familyInfo] =
        ['child-file-info', 'family-file-info'].map(els);
    const [noChildMsg, noFamilyMsg] =
        ['no-child-images', 'no-family-images'].map(els);

    let children = [];
    let selectedChildId = null;

    async function loadChildren() {
        try {
            const response = await fetch('/api/children');
            const responseText = await response.text();

            if (!response.ok) {
                let errorMessage = `Eroare HTTP! Status: ${response.status}`;
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {}
                alert('Eroare la încărcarea copiilor: ' + errorMessage);
                return;
            }

            try {
                children = JSON.parse(responseText);
            } catch (jsonParseError) {
                alert('Eroare internă la procesarea listei de copii. Verificați consola.');
                return;
            }

            childDropdown.innerHTML = '<option value="">Alege un copil</option>';

            if (children && children.length > 0) {
                children.forEach(c => childDropdown.innerHTML += `<option value="${c.id}">${c.name}</option>`);
                selectedChildId = children[0].id;
                childDropdown.value = selectedChildId;
                childTitle.textContent = `Poze cu ${children[0].name}`;
            } else {
                childTitle.textContent = 'Poze cu Copilul (Adaugă un copil în profil)';
                selectedChildId = null;
            }
        } catch (e) {
            childTitle.textContent = 'Poze cu Copilul (Eroare la încărcare)';
            alert('Eroare de rețea la încărcarea listei de copii. Verificați consola.');
        }
    }

    const displayImage = (grid, path, id) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.dataset.imageId = id;
        item.innerHTML = `<img src="${path}" alt="Galerie Foto">
                          <button class="delete-btn">X</button>`;
        item.querySelector('.delete-btn').onclick = () => confirm('Ești sigur că vrei să ștergi?') && deleteImage(id, item);
        grid.appendChild(item);
    };

    async function loadGallery() {
        childGrid.innerHTML = '';
        familyGrid.innerHTML = '';
        noChildMsg.style.display = 'block';
        noFamilyMsg.style.display = 'block';

        try {
            const response = await fetch('/api/gallery/images');
            const responseText = await response.text();

            if (!response.ok) {
                const errorText = responseText;
                alert('Eroare la încărcarea imaginilor galeriei: ' + (errorText || response.statusText));
                return;
            }
            let images;
            try {
                images = JSON.parse(responseText);
            } catch (jsonParseError) {
                alert('Eroare internă la procesarea imaginilor galeriei. Verificați consola.');
                return;
            }

            let [hasChild, hasFamily] = [false, false];

            images.forEach(img => {
                if (img.category === 'child' && selectedChildId !== null && parseInt(img.child_id) === parseInt(selectedChildId)) {
                    displayImage(childGrid, img.file_path, img.id);
                    hasChild = true;
                } else if (img.category === 'family') {
                    displayImage(familyGrid, img.file_path, img.id);
                    hasFamily = true;
                }
            });
            noChildMsg.style.display = hasChild ? 'none' : 'block';
            noFamilyMsg.style.display = hasFamily ? 'none' : 'block';
        } catch (e) {}
    }

    async function deleteImage(id, itemElement) {
        try {
            const res = await fetch(`/api/gallery/images/${id}`, { method: 'DELETE' });
            const responseText = await res.text();
            let data = {};
            try {
                data = JSON.parse(responseText);
            } catch (e) {}

            if (res.ok) {
                itemElement.remove();
                alert(data.message || 'Imagine ștearsă cu succes!');
            } else {
                alert(`Eroare la ștergere: ${data.message || responseText || res.statusText}`);
            }
            loadGallery();
        } catch (e) {
            alert('Eroare de rețea la ștergerea imaginii.');
        }
    }

    async function handleUpload(event, category) {
        const files = event.target.files;
        if (!files.length) return;

        const infoEl = category === 'child' ? childInfo : familyInfo;
        infoEl.textContent = `Se încarcă ${files.length} fișier(e)...`;

        const formData = new FormData();
        Array.from(files).forEach(f => formData.append('image', f));
        formData.append('category', category);

        if (category === 'child') {
            if (!selectedChildId) {
                alert('Selectează un copil pentru a încărca o poză de copil!');
                infoEl.textContent = 'Selectează un copil!';
                event.target.value = '';
                return;
            }
            formData.append('childId', selectedChildId);
        }

        try {
            const res = await fetch('/api/gallery/upload', { method: 'POST', body: formData });
            const responseText = await res.text();
            let data = {};
            try {
                data = JSON.parse(responseText);
            } catch (e) {}

            if (res.ok) {
                infoEl.textContent = `Încărcat: ${data.message || 'Imagine încărcată cu succes.'}`;
                alert(data.message || 'Imagine încărcată cu succes!');
                loadGallery();
            } else {
                infoEl.textContent = `Eroare: ${data.message || responseText || res.statusText}`;
                alert(`Eroare la încărcare: ${data.message || responseText || res.statusText}`);
            }
        } catch (e) {
            infoEl.textContent = 'Eroare de rețea.';
            alert('Eroare de rețea la încărcare. Verificați consola pentru detalii.');
        } finally {
            event.target.value = '';
        }
    }

    childDropdown.onchange = () => {
        selectedChildId = childDropdown.value ? parseInt(childDropdown.value) : null;
        const selectedChildName = childDropdown.value ? childDropdown.options[childDropdown.selectedIndex].text : 'Alege un copil';
        childTitle.textContent = selectedChildId ? `Poze cu ${selectedChildName}` : 'Poze cu Copilul (Alege un copil)';
        loadGallery();
    };
    uploadChild.onchange = e => handleUpload(e, 'child');
    uploadFamily.onchange = e => handleUpload(e, 'family');

    await loadChildren();
    loadGallery();
});