'use client';

import React, { useState } from 'react';
import css from './main.module.scss';

interface Post {
  id: string; title: string; content: string;
  authorId: string; authorName: string;
  tags: string[]; isPrivate: boolean; createdAt: string;
}
interface Comment { id: string; postId: string; author: string; text: string; }

export const Main: React.FC = () => {
  const getStorage = (key: string, fallback: string) => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem(key) || fallback);
    }
    return JSON.parse(fallback);
  };

  const [currentUser, setCurrentUser] = useState<{id: string; username: string} | null>(() => getStorage('b_user', 'null'));
  const [posts, setPosts] = useState<Post[]>(() => getStorage('b_posts', '[]'));
  const [comments, setComments] = useState<Comment[]>(() => getStorage('b_comments', '[]'));
  const [subs, setSubs] = useState<Record<string, string[]>>(() => getStorage('b_subs', '{}'));

  const [authInput, setAuthInput] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tab, setTab] = useState<'public' | 'subs'>('public');
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  const savePosts = (newPosts: Post[]) => { setPosts(newPosts); localStorage.setItem('b_posts', JSON.stringify(newPosts)); };
  const saveComments = (newComments: Comment[]) => { setComments(newComments); localStorage.setItem('b_comments', JSON.stringify(newComments)); };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authInput.trim()) return;
    const user = { id: authInput.toLowerCase(), username: authInput.trim() };
    setCurrentUser(user);
    localStorage.setItem('b_user', JSON.stringify(user));
    setAuthInput('');
  };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title.trim() || !content.trim()) return;
    const parsedTags = tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t);

    if (editId) {
      savePosts(posts.map(p => p.id === editId ? { ...p, title, content, tags: parsedTags, isPrivate } : p));
      setEditId(null);
    } else {
      const newPost: Post = {
        id: Date.now().toString(), title, content, isPrivate,
        authorId: currentUser.id, authorName: currentUser.username,
        tags: parsedTags, createdAt: new Date().toLocaleDateString()
      };
      savePosts([newPost, ...posts]);
    }
    setTitle(''); setContent(''); setTags(''); setIsPrivate(false);
  };

  const handleDelete = (id: string) => {
    savePosts(posts.filter(p => p.id !== id));
    saveComments(comments.filter(c => c.postId !== id));
  };

  const toggleSub = (authorId: string) => {
    if (!currentUser) return;
    const userSubs = subs[currentUser.id] || [];
    const nextSubs = userSubs.includes(authorId) ? userSubs.filter(id => id !== authorId) : [...userSubs, authorId];
    const updated = { ...subs, [currentUser.id]: nextSubs };
    setSubs(updated);
    localStorage.setItem('b_subs', JSON.stringify(updated));
  };

  const addComment = (postId: string) => {
    const text = commentText[postId];
    if (!text?.trim()) return;
    const newComment = { id: Date.now().toString(), postId, author: currentUser?.username || 'Гость', text };
    saveComments([...comments, newComment]);
    setCommentText({ ...commentText, [postId]: '' });
  };

  const mySubs = currentUser ? subs[currentUser.id] || [] : [];
  const filteredPosts = posts.filter(p => {
    if (selectedTag && !p.tags.includes(selectedTag)) return false;
    if (tab === 'subs') return mySubs.includes(p.authorId);
    return !p.isPrivate || (currentUser && p.authorId === currentUser.id);
  });

  const allTags = Array.from(new Set(posts.flatMap(p => p.tags)));

  return (
    <div className={css.container}>
      <header className={css.header}>
        <h2>DevBlog</h2>
        {currentUser ? (
          <div>@{currentUser.username} <button onClick={() => { setCurrentUser(null); localStorage.removeItem('b_user'); }} className={css.btnSecondary}>Выйти</button></div>
        ) : (
          <form onSubmit={handleAuth} className={css.authForm}>
            <input value={authInput} onChange={e => setAuthInput(e.target.value)} placeholder="Никнейм" className={css.input} />
            <button type="submit" className={css.btnPrimary}>Войти</button>
          </form>
        )}
      </header>

      <div className={css.mainGrid}>
        <aside className={css.sidebar}>
          {currentUser && (
            <div className={css.card}>
              <h3>{editId ? 'Редактировать' : 'Новый пост'}</h3>
              <form onSubmit={handlePost} className={css.postForm}>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Заголовок" className={css.input} required />
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Текст" className={css.textarea} required />
                <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Теги (через запятую)" className={css.input} />
                <label className={css.checkboxLabel}><input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} /> Скрытый пост</label>
                <button type="submit" className={css.btnPrimary}>{editId ? 'Сохранить' : 'Опубликовать'}</button>
              </form>
            </div>
          )}
          <div className={css.card}>
            <h3>Теги</h3>
            <div className={css.tagCloud}>
              <button onClick={() => setSelectedTag(null)} className={`${css.tagBadge} ${!selectedTag ? css.activeTag : ''}`}>Все</button>
              {allTags.map(t => <button key={t} onClick={() => setSelectedTag(t)} className={`${css.tagBadge} ${selectedTag === t ? css.activeTag : ''}`}>#{t}</button>)}
            </div>
          </div>
        </aside>

        <main className={css.feedContainer}>
          <div className={css.tabs}>
            <button onClick={() => setTab('public')} className={`${css.tabLink} ${tab === 'public' ? css.activeTabLink : ''}`}>Публичные</button>
            {currentUser && <button onClick={() => setTab('subs')} className={`${css.tabLink} ${tab === 'subs' ? css.activeTabLink : ''}`}>Подписки</button>}
          </div>

          <div className={css.postsList}>
            {filteredPosts.map(p => {
              const isMe = currentUser && p.authorId === currentUser.id;
              return (
                <article key={p.id} className={css.postCard}>
                  <div className={css.postHeader}>
                    <span>@{p.authorName} {currentUser && !isMe && <button onClick={() => toggleSub(p.authorId)} className={css.btnLink}>{mySubs.includes(p.authorId) ? 'Отписаться' : 'Подписаться'}</button>}</span>
                    {p.isPrivate && <span className={css.privateBadge}>Скрытый</span>}
                  </div>
                  <h3>{p.title}</h3>
                  <p>{p.content}</p>
                  <div>{p.tags.map(t => <span key={t} className={css.tagItem}>#{t} </span>)}</div>
                  {isMe && <div className={css.authorActions}><button onClick={() => { setEditId(p.id); setTitle(p.title); setContent(p.content); setTags(p.tags.join(', ')); setIsPrivate(p.isPrivate); }} className={css.btnEdit}>Редактировать</button><button onClick={() => handleDelete(p.id)} className={css.btnDelete}>Удалить</button></div>}
                  
                  <div className={css.commentsSection}>
                    {comments.filter(c => c.postId === p.id).map(c => <div key={c.id}><strong>{c.author}:</strong> {c.text}</div>)}
                    <div className={css.commentForm}>
                      <input value={commentText[p.id] || ''} onChange={e => setCommentText({...commentText, [p.id]: e.target.value})} placeholder="Коммент..." className={css.inputSmall} />
                      <button onClick={() => addComment(p.id)} className={css.btnSmall}>➡</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};
