import React, { useState } from 'react';
import css from './main.module.scss';

interface Book {
  id: string; title: string; author: string; category: string;
  year: number; price: number; isAvailable: boolean; status: string;
}
interface Rental {
  id: string; bookId: string; bookTitle: string; user: string;
  duration: string; expiresAt: string; reminded: boolean;
}

const DEFAULT_BOOKS: Book[] = [
  { id: '1', title: 'Преступление и наказание', author: 'Фёдор Достоевский', category: 'Классика', year: 1866, price: 450, isAvailable: true, status: 'Новинка' },
  { id: '2', title: 'Мастер и Маргарита', author: 'Михаил Булгаков', category: 'Фантастика', year: 1940, price: 500, isAvailable: true, status: 'Популярное' },
  { id: '3', title: '1984', author: 'Джордж Оруэлл', category: 'Антиутопия', year: 1949, price: 400, isAvailable: true, status: 'В наличии' }
];

export const Main: React.FC = () => {
  const getStorage = (key: string, fallback: string) => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem(key) || fallback);
    }
    return JSON.parse(fallback);
  };

  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [books, setBooks] = useState<Book[]>(() => getStorage('bk_books', JSON.stringify(DEFAULT_BOOKS)));
  const [rentals, setRentals] = useState<Rental[]>(() => getStorage('bk_rentals', '[]'));
  const [purchases, setPurchases] = useState<string[]>(() => getStorage('bk_purchases', '[]'));

  const [sortCategory, setSortCategory] = useState('');
  const [sortAuthor, setSortAuthor] = useState('');
  const [sortYear, setSortYear] = useState('');

  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStatus, setNewStatus] = useState('В наличии');
  const [editId, setEditId] = useState<string | null>(null);

  const today = new Date();
  const notifications: string[] = [];

  rentals.forEach((r) => {
    const expDate = new Date(r.expiresAt);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 3 && diffDays >= 0) {
      notifications.push(`Автоматическое напоминание пользователю ${r.user}: Срок аренды книги "${r.bookTitle}" истекает через ${diffDays} дн. (${r.duration})`);
    }
  });

  const saveBooks = (newBooks: Book[]) => { setBooks(newBooks); localStorage.setItem('bk_books', JSON.stringify(newBooks)); };

  const handleAddOrEditBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAuthor.trim()) return;
    if (editId) {
      saveBooks(books.map(b => b.id === editId ? { ...b, title: newTitle, author: newAuthor, category: newCategory, year: Number(newYear), price: Number(newPrice), status: newStatus } : b));
      setEditId(null);
    } else {
      saveBooks([...books, { id: Date.now().toString(), title: newTitle, author: newAuthor, category: newCategory, year: Number(newYear) || 2024, price: Number(newPrice) || 0, isAvailable: true, status: newStatus }]);
    }
    setNewTitle(''); setNewAuthor(''); setNewCategory(''); setNewYear(''); setNewPrice(''); setNewStatus('В наличии');
  };

  const toggleAvailability = (id: string) => { saveBooks(books.map(b => b.id === id ? { ...b, isAvailable: !b.isAvailable } : b)); };

  const handleBuy = (book: Book) => {
    if (!book.isAvailable) return;
    const updated = [...purchases, book.title];
    setPurchases(updated);
    localStorage.setItem('bk_purchases', JSON.stringify(updated));
    saveBooks(books.map(b => b.id === book.id ? { ...b, isAvailable: false } : b));
    alert(`Вы успешно купили книгу "${book.title}"!`);
  };

  const handleRent = (book: Book, duration: string, days: number) => {
    if (!book.isAvailable) return;
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    const updated = [...rentals, { id: Date.now().toString(), bookId: book.id, bookTitle: book.title, user: 'User_Guest', duration, expiresAt: expires.toISOString(), reminded: false }];
    setRentals(updated);
    localStorage.setItem('bk_rentals', JSON.stringify(updated));
    saveBooks(books.map(b => b.id === book.id ? { ...b, isAvailable: false } : b));
    alert(`Книга "${book.title}" арендована на ${duration}!`);
  };

  const filteredBooks = books.filter(b => {
    if (sortCategory && b.category.toLowerCase() !== sortCategory.toLowerCase()) return false;
    if (sortAuthor && !b.author.toLowerCase().includes(sortAuthor.toLowerCase())) return false;
    if (sortYear && b.year !== Number(sortYear)) return false;
    return true;
  });

  const categories = Array.from(new Set(books.map(b => b.category)));

  return (
    <div className={css.container}>
      <header className={css.header}>
        <h2>BookStore Concept</h2>
        <div className={css.roleSwitcher}>
          <button onClick={() => setRole('user')} className={`${css.btnSecondary} ${role === 'user' ? css.activeTabLink : ''}`}>Интерфейс Пользователя</button>
          <button onClick={() => setRole('admin')} className={`${css.btnSecondary} ${role === 'admin' ? css.activeTabLink : ''}`}>Интерфейс Админа</button>
        </div>
      </header>

      {role === 'admin' && notifications.length > 0 && (
        <div className={css.adminAlerts}>
          <h4>Система уведомлений (Автоматически):</h4>
          {notifications.map((n, i) => <p key={i}>⚠️ {n}</p>)}
        </div>
      )}

      <div className={css.mainGrid}>
        <aside className={css.sidebar}>
          {role === 'admin' ? (
            <div className={css.card}>
              <h3>{editId ? 'Редактировать книгу' : 'Добавить книгу'}</h3>
              <form onSubmit={handleAddOrEditBook} className={css.postForm}>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Название" className={css.input} required />
                <input value={newAuthor} onChange={e => setNewAuthor(e.target.value)} placeholder="Автор" className={css.input} required />
                <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Категория" className={css.input} />
                <input type="number" value={newYear} onChange={e => setNewYear(e.target.value)} placeholder="Год" className={css.input} />
                <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="Цена" className={css.input} />
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className={css.input}>
                  <option value="В наличии">В наличии</option>
                  <option value="Новинка">Новинка</option>
                  <option value="Популярное">Популярное</option>
                </select>
                <button type="submit" className={css.btnPrimary}>{editId ? 'Сохранить' : 'Добавить'}</button>
                {editId && <button type="button" onClick={() => { setEditId(null); setNewTitle(''); setNewAuthor(''); }} className={css.btnSecondary}>Отмена</button>}
              </form>
            </div>
          ) : (
            <div className={css.card}>
              <h3>Фильтры и Сортировка</h3>
              <div className={css.postForm}>
                <select value={sortCategory} onChange={e => setSortCategory(e.target.value)} className={css.input}>
                  <option value="">Все категории</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input value={sortAuthor} onChange={e => setSortAuthor(e.target.value)} placeholder="Поиск автора..." className={css.input} />
                <input type="number" value={sortYear} onChange={e => setSortYear(e.target.value)} placeholder="Точный год..." className={css.input} />
                {(sortCategory || sortAuthor || sortYear) && (
                  <button onClick={() => { setSortCategory(''); setSortAuthor(''); setSortYear(''); }} className={css.btnSecondary}>Сбросить</button>
                )}
              </div>
            </div>
          )}

          {role === 'user' && (purchases.length > 0 || rentals.length > 0) && (
            <div className={css.card}>
              <h3>Моя библиотека</h3>
              {purchases.map((p, i) => <div key={i} className={css.libraryItem}>📖 [Куплено] {p}</div>)}
              {rentals.map((r, i) => <div key={i} className={css.libraryItem}>⏳ [Аренда] {r.bookTitle} (до {new Date(r.expiresAt).toLocaleDateString()})</div>)}
            </div>
          )}
        </aside>

        <main className={css.feedContainer}>
          <div className={css.postsList}>
            {filteredBooks.map(b => (
              <article key={b.id} className={css.postCard}>
                <div className={css.postHeader}>
                  <span>{b.category} • {b.year} г.</span>
                  <span className={`${css.privateBadge} ${b.isAvailable ? '' : css.dangerBadge}`}>{b.status} ({b.isAvailable ? 'Доступна' : 'Выдана/Нет'})</span>
                </div>
                <h3>{b.title}</h3>
                <p>Автор: <strong>{b.author}</strong></p>
                <p>Стоимость: <strong>{b.price} ₽</strong></p>

                {role === 'user' ? (
                  <div className={css.authorActions}>
                    <button onClick={() => handleBuy(b)} disabled={!b.isAvailable} className={css.btnPrimary}>Купить</button>
                    <button onClick={() => handleRent(b, '2 недели', 14)} disabled={!b.isAvailable} className={css.btnSecondary}>Аренда 2 нед.</button>
                    <button onClick={() => handleRent(b, '1 месяц', 30)} disabled={!b.isAvailable} className={css.btnSecondary}>1 месяц</button>
                    <button onClick={() => handleRent(b, '3 месяца', 90)} disabled={!b.isAvailable} className={css.btnSecondary}>3 месяца</button>
                  </div>
                ) : (
                  <div className={css.authorActions}>
                    <button onClick={() => { setEditId(b.id); setNewTitle(b.title); setNewAuthor(b.author); setNewCategory(b.category); setNewYear(String(b.year)); setNewPrice(String(b.price)); setNewStatus(b.status); }} className={css.btnEdit}>Редактировать</button>
                    <button onClick={() => toggleAvailability(b.id)} className={css.btnSecondary}>{b.isAvailable ? 'Сделать недоступной' : 'Сделать доступной'}</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </main>
      </div>
    </div>
  )};