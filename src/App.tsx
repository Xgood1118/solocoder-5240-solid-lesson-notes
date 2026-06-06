import type { Component } from 'solid-js';
import { Route } from '@solidjs/router';
import ShareView from './pages/ShareView';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import CourseList from './pages/CourseList';
import NoteEditor from './pages/NoteEditor';
import Search from './pages/Search';
import Settings from './pages/Settings';

const App: Component = () => {
  return (
    <>
      <Route path="/share/:shareId" component={ShareView} />
      <Route path="/" component={MainLayout}>
        <Route path="" component={Home} />
        <Route path="course/:courseId" component={CourseList} />
        <Route path="course/:courseId/notes/:noteId" component={NoteEditor} />
        <Route path="search" component={Search} />
        <Route path="settings" component={Settings} />
      </Route>
    </>
  );
};

export default App;
