// ============================================
// js/demo-mode.js — In-browser backend for the no-server demo
// ============================================
// Loads AFTER api.js. When window.FITSYNC_DEMO is true it replaces the
// Auth / Workouts / Nutrition / Goals / Admin API objects with
// localStorage-backed implementations that mirror the Express API's
// response shapes, so every page works with no backend.
//
// Set an API origin in config.js to disable this and use the real server.

(function () {
  if (!window.FITSYNC_DEMO) return;

  var DB_KEY = 'fitsync_demo_db_v1';
  var now = Date.now();
  var DAY = 86400000;

  // ── ids & helpers ───────────────────────────────────
  function id(p) { return (p || 'id_') + Math.random().toString(36).slice(2, 10) + now.toString(36).slice(-4); }
  function iso(t) { return new Date(t).toISOString(); }
  function ymd(d) {
    var x = new Date(d);
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  }
  function dayStart(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); }
  function dayEnd(d) { var x = new Date(d); x.setHours(23, 59, 59, 999); return x.getTime(); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function ok(extra) { return Object.assign({ success: true }, extra || {}); }
  function fail(msg) { var e = new Error(msg); return Promise.reject(e); }
  function parseQS(qs) {
    var out = {};
    if (!qs) return out;
    if (typeof qs === 'object') return Object.assign(out, qs);
    String(qs).replace(/^\?/, '').split('&').forEach(function (pair) {
      if (!pair) return;
      var kv = pair.split('=');
      out[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
    });
    return out;
  }

  var CAL_RATE = { strength: 6, cardio: 9, hiit: 11, yoga: 4, flexibility: 3, other: 5 };

  // ── seed data ───────────────────────────────────────
  var EXERCISES = [
    ['Barbell Bench Press', 'chest', 'strength', 'barbell', 'intermediate', 8, 'Lie on a flat bench, grip slightly wider than shoulder-width, lower to chest and press up.'],
    ['Pull-Up', 'back', 'strength', 'bodyweight', 'intermediate', 7, 'Hang from a bar with overhand grip, pull up until chin clears the bar, lower slowly.'],
    ['Squat', 'quadriceps', 'strength', 'barbell', 'intermediate', 9, 'Bar on upper back, push hips back and bend knees until thighs are parallel, drive through heels.'],
    ['Deadlift', 'back', 'strength', 'barbell', 'advanced', 10, 'Hinge at the hips with a neutral back, grip the bar outside the legs, drive through the floor to stand.'],
    ['Overhead Press', 'shoulders', 'strength', 'barbell', 'intermediate', 7, 'Press the bar from shoulder level to lockout overhead, then lower under control.'],
    ['Dumbbell Curl', 'biceps', 'strength', 'dumbbell', 'beginner', 5, 'Curl the dumbbells while supinating the wrist, squeeze at the top, lower slowly.'],
    ['Tricep Dip', 'triceps', 'strength', 'bodyweight', 'beginner', 6, 'On parallel bars, lower until elbows reach 90 degrees, then push back up.'],
    ['Plank', 'abs', 'strength', 'bodyweight', 'beginner', 4, 'Hold a forearm plank with a straight line from head to heels, breathing steadily.'],
    ['Running', 'cardio', 'cardio', 'bodyweight', 'beginner', 11, 'Maintain a steady pace with a natural arm swing, landing midfoot.'],
    ['Burpee', 'full_body', 'cardio', 'bodyweight', 'intermediate', 13, 'Drop to a push-up, jump the feet back in, then explode up with arms overhead.'],
    ['Lunges', 'quadriceps', 'strength', 'bodyweight', 'beginner', 7, 'Step forward, lower the back knee toward the floor, push through the front heel to return.'],
    ['Romanian Deadlift', 'hamstrings', 'strength', 'barbell', 'intermediate', 8, 'Hinge at the hips with near-straight legs, feel the hamstring stretch, return to standing.'],
    ['Hip Thrust', 'glutes', 'strength', 'barbell', 'intermediate', 7, 'Shoulders on a bench, drive the hips up until the body forms a straight line, squeeze the glutes.'],
    ['Calf Raise', 'calves', 'strength', 'machine', 'beginner', 4, 'Rise onto the toes through a full range of motion, hold briefly, lower below the step.'],
    ['Jump Rope', 'cardio', 'cardio', 'other', 'beginner', 12, 'Small efficient jumps clearing the rope, wrists doing the rotating.']
  ].map(function (r) {
    return {
      _id: id('ex_'), name: r[0], muscleGroup: r[1], category: r[2], equipment: r[3],
      difficulty: r[4], caloriesPerMinute: r[5], instructions: r[6], tips: '', isApproved: true,
      createdAt: iso(now - 60 * DAY)
    };
  });

  function seedWorkouts() {
    var defs = [
      ['Push Day', 'strength', 1, [['Barbell Bench Press', 'chest', 4, 8, 60, 0], ['Overhead Press', 'shoulders', 3, 10, 35, 0], ['Tricep Dip', 'triceps', 3, 12, 0, 0]]],
      ['Leg Day', 'strength', 3, [['Squat', 'quadriceps', 5, 5, 90, 0], ['Romanian Deadlift', 'hamstrings', 3, 10, 70, 0], ['Calf Raise', 'calves', 4, 15, 40, 0]]],
      ['Pull Day', 'strength', 4, [['Pull-Up', 'back', 4, 8, 0, 0], ['Dumbbell Curl', 'biceps', 3, 12, 14, 0]]],
      ['Conditioning', 'hiit', 5, [['Burpee', 'full_body', 5, 12, 0, 8], ['Jump Rope', 'cardio', 1, 1, 0, 12]]],
      ['Morning Run', 'cardio', 6, [['Running', 'cardio', 1, 1, 0, 35]]],
      ['Core & Mobility', 'yoga', 7, [['Plank', 'abs', 3, 1, 0, 5], ['Lunges', 'quadriceps', 3, 12, 0, 6]]]
    ];
    return defs.map(function (d) {
      var when = now - d[2] * DAY;
      var exs = d[3].map(function (e) {
        return { _id: id('exe_'), exerciseName: e[0], muscleGroup: e[1], sets: e[2], reps: e[3], weight: e[4], duration: e[5], caloriesBurned: 0, notes: '' };
      });
      return recalcWorkout({
        _id: id('w_'), user: 'u_demo', workoutName: d[0], workoutType: d[1],
        exercises: exs, intensity: 'moderate', notes: '',
        workoutDate: iso(new Date(when).setHours(12, 0, 0, 0)), createdAt: iso(when)
      });
    });
  }

  function seedMeals() {
    var defs = [
      ['Oats & Berries', 'breakfast', 0, 420, 18, 62, 10],
      ['Chicken, Rice & Broccoli', 'lunch', 0, 640, 52, 70, 14],
      ['Greek Yogurt & Almonds', 'snack', 0, 240, 20, 12, 12],
      ['Salmon & Sweet Potato', 'dinner', 0, 580, 42, 48, 22],
      ['Whey Shake', 'post_workout', 0, 180, 30, 6, 2],
      ['Eggs & Toast', 'breakfast', 1, 380, 24, 30, 16],
      ['Turkey Wrap', 'lunch', 1, 520, 38, 46, 18],
      ['Pasta Bolognese', 'dinner', 2, 700, 40, 80, 22]
    ];
    return defs.map(function (m) {
      var when = new Date(now - m[2] * DAY).setHours(m[1] === 'breakfast' ? 8 : m[1] === 'lunch' ? 13 : m[1] === 'dinner' ? 19 : 16, 0, 0, 0);
      return {
        _id: id('m_'), user: 'u_demo', mealName: m[0], mealType: m[1],
        calories: m[3], protein: m[4], carbs: m[5], fats: m[6], fiber: 0, sugar: 0,
        servingSize: '1 serving', notes: '', mealTime: iso(when), createdAt: iso(when)
      };
    });
  }

  function seedGoals() {
    var log = [];
    for (var i = 6; i >= 0; i--) log.push({ _id: id('p_'), weight: 74 - (6 - i) * 0.6, date: iso(now - i * 7 * DAY), notes: '' });
    return [
      {
        _id: id('g_'), user: 'u_demo', goalType: 'weight_loss', title: 'Cut to 70 kg',
        description: 'Lean down for summer', startWeight: 74, targetWeight: 70, currentWeight: log[log.length - 1].weight,
        startDate: iso(now - 42 * DAY), targetDate: iso(now + 42 * DAY),
        weeklyWorkoutTarget: 4, dailyCalorieTarget: 2100, dailyWaterTarget: 3,
        progressLog: log, status: 'active', createdAt: iso(now - 42 * DAY)
      },
      {
        _id: id('g_'), user: 'u_demo', goalType: 'strength', title: 'Bench 100 kg',
        description: 'Add 20 kg to bench in a training block', startWeight: 0, targetWeight: 0, currentWeight: 0,
        startDate: iso(now - 20 * DAY), targetDate: iso(now + 70 * DAY),
        weeklyWorkoutTarget: 5, dailyCalorieTarget: 2600, dailyWaterTarget: 3,
        progressLog: [], status: 'active', createdAt: iso(now - 20 * DAY)
      }
    ];
  }

  function seedUsers() {
    var names = [
      ['sarah_k', 'sarah@example.com', 8], ['mike_lifts', 'mike@example.com', 15],
      ['priya_runs', 'priya@example.com', 22], ['tom_h', 'tom@example.com', 34],
      ['lena_fit', 'lena@example.com', 51], ['dan_o', 'dan@example.com', 66],
      ['aisha_m', 'aisha@example.com', 80], ['carlos_v', 'carlos@example.com', 96]
    ];
    var extra = names.map(function (n, i) {
      return {
        _id: id('u_'), username: n[0], email: n[1], role: 'user',
        age: 22 + (i % 20), weight: 60 + (i * 3 % 35), height: 160 + (i * 4 % 30),
        goal: ['weight_loss', 'muscle_gain', 'maintenance', 'endurance'][i % 4],
        isActive: i !== 3, profileImage: '/assets/default-avatar.svg',
        createdAt: iso(now - n[2] * DAY), lastLogin: iso(now - (i % 5) * DAY)
      };
    });
    return [
      { _id: 'u_demo', username: 'demo', email: 'demo@fitsync.com', role: 'user', age: 25, weight: 70, height: 175, goal: 'muscle_gain', isActive: true, profileImage: '/assets/default-avatar.svg', createdAt: iso(now - 45 * DAY), lastLogin: iso(now) },
      { _id: 'u_admin', username: 'admin', email: 'admin@fitsync.com', role: 'admin', age: 30, weight: 75, height: 175, goal: 'maintenance', isActive: true, profileImage: '/assets/default-avatar.svg', createdAt: iso(now - 92 * DAY), lastLogin: iso(now) }
    ].concat(extra);
  }

  // ── store ───────────────────────────────────────────
  function load() {
    try {
      var raw = localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    var db = { users: seedUsers(), workouts: seedWorkouts(), meals: seedMeals(), goals: seedGoals(), exercises: EXERCISES };
    save(db);
    return db;
  }
  function save(db) {
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) { /* quota / private mode */ }
  }
  var DB = load();

  // ── model logic (mirrors server) ────────────────────
  function recalcWorkout(w) {
    var exs = w.exercises || [];
    w.totalDuration = exs.reduce(function (s, e) { return s + (+e.duration || 0); }, 0);
    w.totalCaloriesBurned = exs.reduce(function (s, e) { return s + (+e.caloriesBurned || 0); }, 0);
    if (w.totalCaloriesBurned === 0 && w.totalDuration > 0) {
      var rate = CAL_RATE[w.workoutType] || 5;
      w.totalCaloriesBurned = Math.round(w.totalDuration * rate);
      exs.forEach(function (e) { if (!e.caloriesBurned && e.duration) e.caloriesBurned = Math.round(e.duration * rate); });
    }
    return w;
  }
  function goalVirtuals(g) {
    var o = clone(g);
    if (!g.startWeight || !g.targetWeight || !g.currentWeight) o.progressPercentage = 0;
    else {
      var total = Math.abs(g.targetWeight - g.startWeight);
      var cur = Math.abs(g.currentWeight - g.startWeight);
      o.progressPercentage = total === 0 ? 100 : Math.min(100, Math.round((cur / total) * 100));
    }
    o.daysRemaining = g.targetDate ? Math.max(0, Math.ceil((new Date(g.targetDate) - new Date()) / DAY)) : null;
    return o;
  }
  function publicUser(u) {
    var o = clone(u);
    delete o.password;
    if (o.weight && o.height) { var h = o.height / 100; o.bmi = (o.weight / (h * h)).toFixed(1); }
    o.id = o._id;
    return o;
  }

  // ── session ─────────────────────────────────────────
  function currentUser() {
    try { return JSON.parse(localStorage.getItem('fitsync_user')) || null; } catch (e) { return null; }
  }
  function startSession(user) {
    localStorage.setItem('fitsync_token', 'demo.' + user._id);
    localStorage.setItem('fitsync_user', JSON.stringify({
      id: user._id, username: user.username, email: user.email, role: user.role,
      goal: user.goal, profileImage: user.profileImage, weight: user.weight, height: user.height, age: user.age
    }));
  }
  function demoUser() { return DB.users.find(function (u) { return u._id === 'u_demo'; }); }

  // ── mock API objects ────────────────────────────────
  var Auth = {
    login: function (d) {
      var u = DB.users.find(function (x) { return x.email === (d && d.email || '').toLowerCase(); });
      // demo: accept the seeded accounts with their real passwords, or any input as the demo user
      if (u && ((u.email === 'admin@fitsync.com' && d.password === 'Admin@123') ||
                (u.email === 'demo@fitsync.com' && d.password === 'Demo@123'))) {
        startSession(u);
      } else {
        startSession(DB.users.find(function (x) { return x._id === 'u_demo'; }));
        u = DB.users.find(function (x) { return x._id === 'u_demo'; });
      }
      return Promise.resolve(ok({ message: 'Welcome back, ' + u.username + '!', token: localStorage.getItem('fitsync_token'), user: publicUser(u) }));
    },
    register: function (d) {
      var u = { _id: 'u_demo', username: (d && d.username) || 'you', email: (d && d.email) || 'you@demo.fit', role: 'user', age: d && d.age, weight: d && d.weight, height: d && d.height, goal: (d && d.goal) || 'maintenance', isActive: true, profileImage: '/assets/default-avatar.svg', createdAt: iso(now), lastLogin: iso(now) };
      var i = DB.users.findIndex(function (x) { return x._id === 'u_demo'; });
      if (i >= 0) DB.users[i] = u; else DB.users.push(u);
      save(DB);
      startSession(u);
      return Promise.resolve(ok({ message: 'Account created!', token: localStorage.getItem('fitsync_token'), user: publicUser(u) }));
    },
    getProfile: function () {
      var cu = currentUser();
      var u = DB.users.find(function (x) { return x._id === (cu && cu.id); }) || DB.users[0];
      return Promise.resolve(ok({ user: publicUser(u) }));
    },
    updateProfile: function (d) {
      var cu = currentUser();
      var u = DB.users.find(function (x) { return x._id === (cu && cu.id); });
      if (!u) return fail('Not found');
      if (d instanceof FormData) {
        var file = d.get('profileImage');
        if (file && file.size) {
          return new Promise(function (res) {
            var fr = new FileReader();
            fr.onload = function () { u.profileImage = fr.result; save(DB); startSession(u); res(ok({ message: 'Profile updated', user: publicUser(u) })); };
            fr.readAsDataURL(file);
          });
        }
        return Promise.resolve(ok({ message: 'Profile updated', user: publicUser(u) }));
      }
      ['username', 'email', 'age', 'weight', 'height', 'goal'].forEach(function (k) { if (d[k] !== undefined) u[k] = d[k]; });
      save(DB); startSession(u);
      return Promise.resolve(ok({ message: 'Profile updated successfully', user: publicUser(u) }));
    },
    changePassword: function () { return Promise.resolve(ok({ message: 'Password changed (demo — not persisted)' })); }
  };

  function pageSlice(arr, p) {
    var page = parseInt(p.page || 1, 10), limit = parseInt(p.limit || 10, 10);
    var start = (page - 1) * limit;
    return { items: arr.slice(start, start + limit), page: page, limit: limit, total: arr.length, totalPages: Math.max(1, Math.ceil(arr.length / limit)) };
  }

  var Workouts = {
    getAll: function (qs) {
      var p = parseQS(qs);
      var list = DB.workouts.slice();
      if (p.workoutType) list = list.filter(function (w) { return w.workoutType === p.workoutType; });
      if (p.startDate) { var f = dayStart(p.startDate); list = list.filter(function (w) { return +new Date(w.workoutDate) >= f; }); }
      if (p.endDate) { var t = dayEnd(p.endDate); list = list.filter(function (w) { return +new Date(w.workoutDate) <= t; }); }
      list.sort(function (a, b) { return new Date(b.workoutDate) - new Date(a.workoutDate); });
      var s = pageSlice(list, p);
      return Promise.resolve(ok({ count: s.items.length, total: s.total, totalPages: s.totalPages, currentPage: s.page, workouts: clone(s.items) }));
    },
    getStats: function () {
      var weekAgo = now - 7 * DAY;
      var recent = DB.workouts.filter(function (w) { return +new Date(w.workoutDate) >= weekAgo; });
      var byDow = {};
      recent.forEach(function (w) {
        var dow = new Date(w.workoutDate).getDay() + 1;
        byDow[dow] = byDow[dow] || { _id: dow, totalCalories: 0, totalDuration: 0, count: 0 };
        byDow[dow].totalCalories += w.totalCaloriesBurned || 0;
        byDow[dow].totalDuration += w.totalDuration || 0;
        byDow[dow].count += 1;
      });
      var weeklyStats = Object.keys(byDow).map(function (k) { return byDow[k]; }).sort(function (a, b) { return a._id - b._id; });
      var all = DB.workouts.reduce(function (acc, w) {
        acc.totalWorkouts += 1; acc.totalCalories += w.totalCaloriesBurned || 0; acc.totalDuration += w.totalDuration || 0; return acc;
      }, { totalWorkouts: 0, totalCalories: 0, totalDuration: 0 });
      all.avgCalories = all.totalWorkouts ? Math.round(all.totalCalories / all.totalWorkouts) : 0;
      var typeMap = {};
      DB.workouts.forEach(function (w) { typeMap[w.workoutType] = (typeMap[w.workoutType] || 0) + 1; });
      var typeBreakdown = Object.keys(typeMap).map(function (k) { return { _id: k, count: typeMap[k] }; }).sort(function (a, b) { return b.count - a.count; });
      return Promise.resolve(ok({ weeklyStats: weeklyStats, allTime: all, typeBreakdown: typeBreakdown }));
    },
    getById: function (wid) {
      var w = DB.workouts.find(function (x) { return x._id === wid; });
      return w ? Promise.resolve(ok({ workout: clone(w) })) : fail('Workout not found');
    },
    create: function (d) {
      var w = recalcWorkout(Object.assign({
        _id: id('w_'), user: 'u_demo', exercises: [], intensity: 'moderate', notes: '',
        workoutDate: iso(now), createdAt: iso(now)
      }, d));
      (w.exercises || []).forEach(function (e) { if (!e._id) e._id = id('exe_'); });
      DB.workouts.push(w); save(DB);
      return Promise.resolve(ok({ message: 'Workout logged successfully!', workout: clone(w) }));
    },
    update: function (wid, d) {
      var w = DB.workouts.find(function (x) { return x._id === wid; });
      if (!w) return fail('Workout not found');
      Object.assign(w, d);
      (w.exercises || []).forEach(function (e) { if (!e._id) e._id = id('exe_'); });
      recalcWorkout(w); save(DB);
      return Promise.resolve(ok({ message: 'Workout updated successfully', workout: clone(w) }));
    },
    delete: function (wid) {
      DB.workouts = DB.workouts.filter(function (x) { return x._id !== wid; }); save(DB);
      return Promise.resolve(ok({ message: 'Workout deleted successfully' }));
    }
  };

  function mealTotals(list) {
    return list.reduce(function (t, m) {
      t.totalCalories += m.calories || 0; t.totalProtein += m.protein || 0;
      t.totalCarbs += m.carbs || 0; t.totalFats += m.fats || 0; t.mealCount += 1; return t;
    }, { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0, mealCount: 0 });
  }

  var Nutrition = {
    getAll: function (qs) {
      var p = parseQS(qs);
      var list = DB.meals.slice();
      var dayList;
      if (p.date) {
        var f = dayStart(p.date), t = dayEnd(p.date);
        list = list.filter(function (m) { var mt = +new Date(m.mealTime); return mt >= f && mt <= t; });
        dayList = list;
      } else {
        dayList = DB.meals.filter(function (m) { var mt = +new Date(m.mealTime); return mt >= dayStart(now) && mt <= dayEnd(now); });
      }
      if (p.mealType) list = list.filter(function (m) { return m.mealType === p.mealType; });
      list.sort(function (a, b) { return new Date(b.mealTime) - new Date(a.mealTime); });
      var s = pageSlice(list, Object.assign({ limit: 20 }, p));
      return Promise.resolve(ok({ count: s.items.length, total: s.total, todayTotals: mealTotals(dayList), meals: clone(s.items) }));
    },
    getMeals: function (qs) { return this.getAll(qs); },
    getWeekly: function () {
      var weekAgo = now - 7 * DAY, byDay = {};
      DB.meals.filter(function (m) { return +new Date(m.mealTime) >= weekAgo; }).forEach(function (m) {
        var k = ymd(m.mealTime);
        byDay[k] = byDay[k] || { _id: k, totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0 };
        byDay[k].totalCalories += m.calories || 0; byDay[k].totalProtein += m.protein || 0;
        byDay[k].totalCarbs += m.carbs || 0; byDay[k].totalFats += m.fats || 0;
      });
      return Promise.resolve(ok({ weeklyData: Object.keys(byDay).sort().map(function (k) { return byDay[k]; }) }));
    },
    create: function (d) {
      var m = Object.assign({ _id: id('m_'), user: 'u_demo', protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, servingSize: '1 serving', notes: '', mealTime: iso(now), createdAt: iso(now) }, d);
      DB.meals.push(m); save(DB);
      return Promise.resolve(ok({ message: 'Meal logged successfully!', meal: clone(m) }));
    },
    update: function (mid, d) {
      var m = DB.meals.find(function (x) { return x._id === mid; });
      if (!m) return fail('Meal not found');
      Object.assign(m, d); save(DB);
      return Promise.resolve(ok({ message: 'Meal updated', meal: clone(m) }));
    },
    delete: function (mid) {
      DB.meals = DB.meals.filter(function (x) { return x._id !== mid; }); save(DB);
      return Promise.resolve(ok({ message: 'Meal deleted successfully' }));
    }
  };

  var Goals = {
    getAll: function () {
      var list = DB.goals.slice().sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); }).map(goalVirtuals);
      return Promise.resolve(ok({ count: list.length, goals: list }));
    },
    create: function (d) {
      var g = Object.assign({
        _id: id('g_'), user: 'u_demo', description: '', currentWeight: d && d.startWeight || 0,
        startDate: iso(now), targetDate: null, weeklyWorkoutTarget: 3, dailyCalorieTarget: 2000,
        dailyWaterTarget: 2.5, progressLog: [], status: 'active', createdAt: iso(now)
      }, d);
      DB.goals.push(g); save(DB);
      return Promise.resolve(ok({ message: 'Goal created successfully!', goal: goalVirtuals(g) }));
    },
    update: function (gid, d) {
      var g = DB.goals.find(function (x) { return x._id === gid; });
      if (!g) return fail('Goal not found');
      Object.assign(g, d); save(DB);
      return Promise.resolve(ok({ message: 'Goal updated', goal: goalVirtuals(g) }));
    },
    logProgress: function (gid, d) {
      var g = DB.goals.find(function (x) { return x._id === gid; });
      if (!g) return fail('Goal not found');
      g.progressLog.push({ _id: id('p_'), weight: d.weight, notes: d.notes || '', date: iso(now) });
      g.currentWeight = d.weight; save(DB);
      var gv = goalVirtuals(g);
      return Promise.resolve(ok({ message: 'Progress logged!', progressPercentage: gv.progressPercentage, goal: gv }));
    },
    delete: function (gid) {
      DB.goals = DB.goals.filter(function (x) { return x._id !== gid; }); save(DB);
      return Promise.resolve(ok({ message: 'Goal deleted' }));
    }
  };

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var Admin = {
    getDashboard: function () {
      var users = DB.users;
      var growth = {};
      users.forEach(function (u) {
        var d = new Date(u.createdAt), k = d.getFullYear() + '-' + d.getMonth();
        growth[k] = growth[k] || { _id: { year: d.getFullYear(), month: d.getMonth() + 1 }, count: 0 };
        growth[k].count += 1;
      });
      var userGrowth = Object.keys(growth).sort().slice(-6).map(function (k) {
        var g = growth[k]; g.date = MONTHS[g._id.month - 1] + ' ' + g._id.year; return g;
      });
      var mealAvg = DB.meals.length ? Math.round(mealTotals(DB.meals).totalCalories / new Set(DB.meals.map(function (m) { return m.user; })).size) : 0;
      var monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      return Promise.resolve(ok({
        stats: {
          totalUsers: users.length,
          activeUsers: users.filter(function (u) { return u.isActive; }).length,
          totalWorkouts: DB.workouts.length,
          totalMeals: DB.meals.length,
          totalExercises: DB.exercises.length,
          activeGoals: DB.goals.filter(function (g) { return g.status === 'active'; }).length,
          newUsersThisMonth: users.filter(function (u) { return new Date(u.createdAt) >= monthStart; }).length,
          newUsersToday: users.filter(function (u) { return +new Date(u.createdAt) >= dayStart(now); }).length,
          avgCaloriesPerUser: mealAvg
        },
        recentUsers: clone(users.slice().sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); }).slice(0, 5).map(publicUser)),
        userGrowth: userGrowth
      }));
    },
    getUsers: function (p) {
      p = parseQS(p);
      var list = DB.users.slice();
      if (p.search) {
        var q = p.search.toLowerCase();
        list = list.filter(function (u) { return u.username.toLowerCase().indexOf(q) >= 0 || u.email.toLowerCase().indexOf(q) >= 0; });
      }
      if (p.role) list = list.filter(function (u) { return u.role === p.role; });
      list.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
      var s = pageSlice(list, p);
      return Promise.resolve(ok({ count: s.items.length, total: s.total, totalPages: s.totalPages, users: clone(s.items.map(publicUser)) }));
    },
    deleteUser: function (uid) {
      if (uid === 'u_demo' || uid === 'u_admin') return fail('Cannot delete the demo accounts');
      DB.users = DB.users.filter(function (x) { return x._id !== uid; }); save(DB);
      return Promise.resolve(ok({ message: 'User and all their data deleted successfully' }));
    },
    toggleUser: function (uid) {
      var u = DB.users.find(function (x) { return x._id === uid; });
      if (!u) return fail('User not found');
      u.isActive = !u.isActive; save(DB);
      return Promise.resolve(ok({ message: 'User ' + (u.isActive ? 'activated' : 'deactivated') + ' successfully', isActive: u.isActive }));
    },
    getExercises: function () {
      return Promise.resolve(ok({ count: DB.exercises.length, total: DB.exercises.length, exercises: clone(DB.exercises) }));
    },
    createExercise: function (d) {
      var e = Object.assign({ _id: id('ex_'), isApproved: true, createdAt: iso(now), tips: '', caloriesPerMinute: 5 }, d);
      DB.exercises.push(e); save(DB);
      return Promise.resolve(ok({ message: 'Exercise added to library', exercise: clone(e) }));
    },
    deleteExercise: function (eid) {
      DB.exercises = DB.exercises.filter(function (x) { return x._id !== eid; }); save(DB);
      return Promise.resolve(ok({ message: 'Exercise deleted' }));
    }
  };

  // ── install overrides ───────────────────────────────
  // api.js declares Auth/Workouts/... as `const`, so the page's bare
  // identifier and window.<name> are the SAME object. Patch methods in
  // place so both bindings (and window.API.*) pick up the demo versions.
  function patch(target, src) {
    if (!target) return src;
    Object.keys(target).forEach(function (k) { delete target[k]; });
    Object.assign(target, src);
    return target;
  }
  patch(window.Auth, Auth);
  patch(window.Workouts, Workouts);
  patch(window.Nutrition, Nutrition);
  patch(window.Goals, Goals);
  patch(window.Admin, Admin);
  if (window.API) {
    window.API.Auth = window.Auth; window.API.Workouts = window.Workouts;
    window.API.Nutrition = window.Nutrition; window.API.Goals = window.Goals;
    window.API.Admin = window.Admin;
  }

  window.requireAuth = function () {
    if (!currentUser()) startSession(demoUser());
    return true;
  };
  window.logout = function () {
    localStorage.removeItem('fitsync_token');
    localStorage.removeItem('fitsync_user');
    window.location.href = '/pages/login.html';
  };
  window.resolveAvatar = function (path) {
    if (!path) return '/assets/default-avatar.svg';
    return path; // data: URIs and /assets paths both work as-is in demo mode
  };

  window.FITSYNC_DEMO_RESET = function () {
    try { localStorage.removeItem(DB_KEY); } catch (e) {}
    window.location.reload();
  };

  // ── small "demo mode" ribbon ────────────────────────
  function ribbon() {
    if (document.getElementById('demo-ribbon')) return;
    var bar = document.createElement('div');
    bar.id = 'demo-ribbon';
    bar.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:9999;display:flex;gap:.55rem;align-items:center;' +
      'background:rgba(99,102,241,.14);border:1px solid rgba(99,102,241,.4);color:#a5b4fc;' +
      'font:600 11px/1 system-ui,sans-serif;padding:7px 11px;border-radius:999px;backdrop-filter:blur(6px)';
    bar.innerHTML = '<span>🎭 Demo mode — data saved in this browser</span>' +
      '<button type="button" style="all:unset;cursor:pointer;color:#c7d2fe;text-decoration:underline">reset</button>';
    bar.querySelector('button').addEventListener('click', window.FITSYNC_DEMO_RESET);
    document.body.appendChild(bar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ribbon);
  else ribbon();
})();
