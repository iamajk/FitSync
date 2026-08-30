const mongoose = require('mongoose');

const ExerciseEntrySchema = new mongoose.Schema({
  exerciseName: { type:String, required:true, trim:true },
  sets:         { type:Number, default:1, min:1 },
  reps:         { type:Number, default:1, min:1 },
  weight:       { type:Number, default:0, min:0 },
  duration:     { type:Number, default:0, min:0 },   // minutes
  caloriesBurned:{ type:Number, default:0, min:0 },
  muscleGroup:  { type:String, enum:['chest','back','shoulders','biceps','triceps','forearms','abs','quadriceps','hamstrings','glutes','calves','full_body','cardio','other'], default:'other' },
  notes:        { type:String, maxlength:200 },
});

const WorkoutSchema = new mongoose.Schema({
  user:        { type:mongoose.Schema.Types.ObjectId, ref:'User', required:true, index:true },
  workoutName: { type:String, required:true, trim:true },
  workoutType: { type:String, enum:['strength','cardio','hiit','yoga','flexibility','other'], default:'other' },
  exercises:   [ExerciseEntrySchema],
  totalDuration:      { type:Number, default:0 },
  totalCaloriesBurned:{ type:Number, default:0 },
  workoutDate: { type:Date, default:Date.now },
  intensity:   { type:String, enum:['low','moderate','high','extreme'], default:'moderate' },
  notes:       { type:String, maxlength:500 },
}, { timestamps:true });

// Auto-calculate totals; estimate calories from duration if none entered
WorkoutSchema.pre('save', function(next) {
  if (this.exercises && this.exercises.length > 0) {
    this.totalDuration = this.exercises.reduce((s, ex) => s + (ex.duration || 0), 0);
    this.totalCaloriesBurned = this.exercises.reduce((s, ex) => s + (ex.caloriesBurned || 0), 0);
    if (this.totalCaloriesBurned === 0 && this.totalDuration > 0) {
      const rate = { strength:6, cardio:9, hiit:11, yoga:4, flexibility:3, other:5 }[this.workoutType] || 5;
      this.totalCaloriesBurned = Math.round(this.totalDuration * rate);
      this.exercises.forEach(ex => {
        if (!ex.caloriesBurned && ex.duration) ex.caloriesBurned = Math.round(ex.duration * rate);
      });
    }
  }
  next();
});

WorkoutSchema.statics.getWeeklyStats = async function(userId) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return this.aggregate([
    { $match:{ user:userId, workoutDate:{ $gte:oneWeekAgo } } },
    { $group:{ _id:{ $dayOfWeek:'$workoutDate' }, totalCalories:{ $sum:'$totalCaloriesBurned' }, totalDuration:{ $sum:'$totalDuration' }, count:{ $sum:1 } } },
    { $sort:{ _id:1 } },
  ]);
};

module.exports = mongoose.model('Workout', WorkoutSchema);
