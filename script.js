let books = [];

// ===== ЗАГРУЗКА КНИГ С СЕРВЕРА =====
fetch('/api/books')
    .then(res => {
        if (!res.ok) throw new Error('Ошибка загрузки');
        return res.json();
    })
    .then(data => {
        books = data;
        render(books);
    })
    .catch(() => {
        document.getElementById('bookList').innerHTML = '<p style="text-align:center;color:#ef5350;padding:20px;">❌ Не удалось загрузить книги</p>';
    });

// ===== СОРТИРОВКА =====
function sortBooks(list, sortType) {
    const sorted = [...list];
    switch (sortType) {
        case 'year-asc':
            return sorted.sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0));
        case 'year-desc':
            return sorted.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
        case 'author-asc':
            return sorted.sort((a, b) => a.author.localeCompare(b.author, 'ru', { sensitivity: 'base' }));
        case 'author-desc':
            return sorted.sort((a, b) => b.author.localeCompare(a.author, 'ru', { sensitivity: 'base' }));
        case 'title-asc':
            return sorted.sort((a, b) => a.title.localeCompare(b.title, 'ru', { sensitivity: 'base' }));
        case 'title-desc':
            return sorted.sort((a, b) => b.title.localeCompare(a.title, 'ru', { sensitivity: 'base' }));
        default:
            return sorted;
    }
}

// ===== ОТРИСОВКА =====
function render(list) {
    const sortType = document.getElementById('sort').value;
    const sorted = sortBooks(list, sortType);

    const container = document.getElementById('bookList');

    if (sorted.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">📭 Ничего не найдено</p>';
        return;
    }

    container.innerHTML = sorted.map((b, i) => `
        <div class="book-card" data-index="${i}">
            <div class="book-info">
                <h3>📖 ${b.title}</h3>
                <p>✍️ ${b.author} • ${b.year || '—'}</p>
            </div>
            <div class="book-actions">
                <button class="detail-btn" data-index="${i}">📄 Подробнее</button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.detail-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = btn.dataset.index;
            const book = sorted[idx];
            openModal(book);
        });
    });

    document.querySelectorAll('.book-card').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.closest('.detail-btn')) return;
            const idx = el.dataset.index;
            const book = sorted[idx];
            openModal(book);
        });
    });
}

// ===== ОТКРЫТИЕ МОДАЛКИ =====
function openModal(book) {
    document.getElementById('modalTitle').textContent = book.title || '—';
    document.getElementById('modalAuthor').textContent = book.author || '—';
    document.getElementById('modalCount').textContent = book.count || '?';
    document.getElementById('modalPay').textContent = book.pay || '?';
    document.getElementById('modalShelf').textContent = book.shelf || '?';
    document.getElementById('modalWardrobe').textContent = book.wardrobe || '?';
    document.getElementById('modalYear').textContent = book.year || '—';

    const container = document.getElementById('modalImages');
    container.innerHTML = '';

    if (book.images && book.images.length > 0) {
        book.images.forEach(url => {
            const img = document.createElement('img');
            img.src = url;
            img.alt = 'Обложка книги';
            img.className = 'modal-image';
            container.appendChild(img);
        });
    } else {
        container.innerHTML = '<p style="color:#888;font-size:14px;">📷 Нет фото</p>';
    }

    document.getElementById('modal').classList.add('show');
}

// ===== ЗАКРЫТИЕ МОДАЛКИ =====
document.querySelector('.close').onclick = () => {
    document.getElementById('modal').classList.remove('show');
};
document.getElementById('modal').onclick = (e) => {
    if (e.target === e.currentTarget) {
        document.getElementById('modal').classList.remove('show');
    }
};

// ===== ПОИСК + СОРТИРОВКА =====
function update() {
    const q = document.getElementById('search').value.toLowerCase();
    const filtered = books.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q)
    );
    render(filtered);
}

document.getElementById('search').addEventListener('input', update);
document.getElementById('sort').addEventListener('change', update);

// ===== ПОКАЗАТЬ / СКРЫТЬ ФОРМУ =====
document.getElementById('showAddBtn').addEventListener('click', () => {
    document.getElementById('addForm').style.display = 'block';
    document.getElementById('showAddBtn').style.display = 'none';
});

document.getElementById('cancelAddBtn').addEventListener('click', () => {
    document.getElementById('addForm').style.display = 'none';
    document.getElementById('showAddBtn').style.display = 'block';
    // Очищаем поля
    document.getElementById('newTitle').value = '';
    document.getElementById('newAuthor').value = '';
    document.getElementById('newYear').value = '';
    document.getElementById('newCount').value = '';
    document.getElementById('newPay').value = '';
    document.getElementById('newShelf').value = '';
    document.getElementById('newWardrobe').value = '';
    document.getElementById('newImage').value = '';
});

// ===== ДОБАВЛЕНИЕ НОВОЙ КНИГИ =====
function addBook() {
    const title = document.getElementById('newTitle').value.trim();
    const author = document.getElementById('newAuthor').value.trim();
    const year = document.getElementById('newYear').value.trim();
    const count = document.getElementById('newCount').value.trim();
    const pay = document.getElementById('newPay').value.trim();
    const shelf = document.getElementById('newShelf').value.trim();
    const wardrobe = document.getElementById('newWardrobe').value.trim();
    const fileInput = document.getElementById('newImage');
    const file = fileInput.files[0];

    if (!title || !author) {
        alert('⚠️ Название и автор обязательны!');
        return;
    }

    const bookData = {
        title, author, year, count, pay, shelf, wardrobe,
        images: []
    };

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            bookData.images = [e.target.result];
            sendBook(bookData);
        };
        reader.readAsDataURL(file);
    } else {
        sendBook(bookData);
    }
}

function sendBook(newBook) {
    fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook)
    })
    .then(res => {
        if (!res.ok) throw new Error('Ошибка сервера');
        return res.json();
    })
    .then(updatedBooks => {
        books = updatedBooks;
        update();

        // Очищаем поля и скрываем форму
        document.getElementById('newTitle').value = '';
        document.getElementById('newAuthor').value = '';
        document.getElementById('newYear').value = '';
        document.getElementById('newCount').value = '';
        document.getElementById('newPay').value = '';
        document.getElementById('newShelf').value = '';
        document.getElementById('newWardrobe').value = '';
        document.getElementById('newImage').value = '';
        document.getElementById('addForm').style.display = 'none';
        document.getElementById('showAddBtn').style.display = 'block';

        const btn = document.getElementById('addBtn');
        const originalText = btn.textContent;
        btn.textContent = '✅ Добавлено!';
        btn.style.background = '#66bb6a';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '#4a6cf7';
        }, 2000);
    })
    .catch(err => {
        alert('❌ Ошибка при добавлении книги: ' + err.message);
        console.error(err);
    });
}

document.getElementById('addBtn').addEventListener('click', addBook);

document.querySelectorAll('#newTitle, #newAuthor, #newYear, #newCount, #newPay, #newShelf, #newWardrobe').forEach(input => {
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addBook();
        }
    });
});