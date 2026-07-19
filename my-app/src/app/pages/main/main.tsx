'use client';

import React, { useState } from 'react';
import css from './main.module.scss';

interface Trip {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  cost: number;
  imageUrl: string;
  placesToVisit: string;
  createdAt: string;
}

const DEFAULT_TRIPS: Trip[] = [
  { id: '1', userId: 'alex', userName: 'Алексей', title: 'Выходные в Казани', description: 'Прекрасная поездка, посетили Кремль и попробовали эчпочмаки.', cost: 15000, imageUrl: 'https://unsplash.com', placesToVisit: 'Казанский Кремль, ул. Баумана, Кул-Шариф', createdAt: '15.07.2026' },
  { id: '2', userId: 'marta', userName: 'Марта', title: 'Прогулки по Санкт-Петербургу', description: 'Погода порадовала, Эрмитаж как всегда великолепен.', cost: 25000, imageUrl: 'https://unsplash.com', placesToVisit: 'Эрмитаж, Спас на Крови, Петергоф', createdAt: '18.07.2026' }
];

export const Main: React.FC = () => {
  const getStorage = (key: string, fallback: string) => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem(key) || fallback);
    }
    return JSON.parse(fallback);
  };

  const [currentUser, setCurrentUser] = useState<{id: string; username: string} | null>(() => getStorage('tr_user', 'null'));
  const [trips, setTrips] = useState<Trip[]>(() => getStorage('tr_trips', JSON.stringify(DEFAULT_TRIPS))); 
  
  const [authInput, setAuthInput] = useState('');
  const [tab, setTab] = useState<'all' | 'my'>('all');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [placesToVisit, setPlacesToVisit] = useState('');

  const saveTrips = (newTrips: Trip[]) => {
    setTrips(newTrips);
    localStorage.setItem('tr_trips', JSON.stringify(newTrips));
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authInput.trim()) return;
    const user = { id: authInput.toLowerCase().replace(/\s+/g, ''), username: authInput.trim() };
    setCurrentUser(user);
    localStorage.setItem('tr_user', JSON.stringify(user));
    setAuthInput('');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tr_user');
  };

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title.trim() || !description.trim()) return;

    const newTrip: Trip = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.username,
      title: title.trim(),
      description: description.trim(),
      cost: Number(cost) || 0,
      imageUrl: imageUrl.trim() || 'https://unsplash.com',
      placesToVisit: placesToVisit.trim(),
      createdAt: new Date().toLocaleDateString()
    };

    saveTrips([newTrip, ...trips]);
    setTitle(''); setDescription(''); setCost(''); setImageUrl(''); setPlacesToVisit('');
  };

  const filteredTrips = trips.filter(t => {
    if (tab === 'my') return currentUser && t.userId === currentUser.id;
    return true;
  });
  return (
    <div className={css.container}>
      <header className={css.header}>
        <h2>Дневник Путешествий</h2>
        <div className={css.roleSwitcher}>
          {currentUser ? (
            <div>
              <span style={{ marginRight: '15px' }}>Привет, <strong>{currentUser.username}</strong></span>
              <button onClick={handleLogout} className={css.btnSecondary}>Выйти</button>
            </div>
          ) : (
            <form onSubmit={handleAuth} className={css.authForm}>
              <input value={authInput} onChange={e => setAuthInput(e.target.value)} placeholder="Имя путешественника" className={css.input} required />
              <button type="submit" className={css.btnPrimary}>Войти</button>
            </form>
          )}
        </div>
      </header>

      <div className={css.mainGrid}>
        <aside className={css.sidebar}>
          {currentUser ? (
            <div className={css.card}>
              <h3>Добавить поездку</h3>
              <form onSubmit={handleAddTrip} className={css.postForm}>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Название (куда и когда)" className={css.input} required />
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Описание ваших впечатлений..." className={css.textarea} required />
                <input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="Стоимость (в ₽)" className={css.input} />
                <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Ссылка на фото (URL)" className={css.input} />
                <input value={placesToVisit} onChange={e => setPlacesToVisit(e.target.value)} placeholder="Что посетить (через запятую)" className={css.input} />
                <button type="submit" className={css.btnPrimary}>Опубликовать дневник</button>
              </form>
            </div>
          ) : (
            <div className={css.card}>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Войдите в систему, чтобы начать записывать свои путешествия и делиться локациями.</p>
            </div>
          )}
        </aside>

        <main className={css.feedContainer}>
          <div className={css.tabs}>
            <button onClick={() => setTab('all')} className={`${css.tabLink} ${tab === 'all' ? css.activeTabLink : ''}`}>Все путешествия</button>
            {currentUser && <button onClick={() => setTab('my')} className={`${css.tabLink} ${tab === 'my' ? css.activeTabLink : ''}`}>Мои записи</button>}
          </div>

          <div className={css.postsList}>
            {filteredTrips.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center' }}>Записей пока нет.</p>
            ) : (
              filteredTrips.map(t => (
                <article key={t.id} className={css.postCard}>
                  <div className={css.postHeader}>
                    <span>Автор: <strong>@{t.userName}</strong></span>
                    <span>{t.createdAt}</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }} className={css.tripContentLayout}>
                    <img src={t.imageUrl} alt={t.title} style={{ width: '180px', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>{t.title}</h3>
                      <p style={{ color: '#cbd5e1', fontSize: '14px', margin: '0 0 12px 0' }}>{t.description}</p>
                      
                      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <span className={css.privateBadge}>💰 Бюджет: {t.cost.toLocaleString()} ₽</span>
                        {t.placesToVisit && (
                          <span className={css.privateBadge} style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.2)' }}>
                            📍 Места: {t.placesToVisit}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
