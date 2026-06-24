import { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { Star, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';

const Feedback = () => {
  const { user, authenticatedFetch } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch all reviews from backend
  const fetchFeedbacks = async () => {
    try {
      const response = await fetch(`${API_URL}/feedback`);
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data);
      }
    } catch (err) {
      console.error('Failed to load feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFeedbacks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return;
    setSubmitLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authenticatedFetch('/feedback', {
        method: 'POST',
        body: JSON.stringify({ rating, comment })
      });

      if (response.ok) {
        setSuccess('Thank you! Your feedback has been successfully recorded.');
        setComment('');
        setRating(5);
        fetchFeedbacks(); // Refresh review list
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit review.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10 font-sans text-gray-900 dark:text-gray-100">
      
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black font-display tracking-tight text-gray-900 dark:text-white uppercase">
          Customer Feedback
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
          Share your purchase experience with our Tyres, Oils, and Spare Parts. Your feedback helps us improve our distribution services.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* SUBMISSION FORM PANEL */}
        <div className="md:col-span-1 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 p-6 rounded-none shadow-sm space-y-5">
          <h2 className="text-sm font-black uppercase text-black dark:text-white tracking-wider flex items-center gap-2 border-b pb-3 border-gray-100 dark:border-gray-850">
            <MessageSquare className="w-4.5 h-4.5 text-indigo-600" /> Write A Review
          </h2>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-955/20 text-red-700 dark:text-red-400 text-xs rounded-none border border-red-150 dark:border-red-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-955/20 text-green-700 dark:text-green-400 text-xs rounded-none border border-green-150 dark:border-green-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer display name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Customer Name</label>
              <div className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-450 font-bold text-xs uppercase tracking-wider rounded-none select-none">
                {user?.name || 'Guest User'}
              </div>
            </div>

            {/* Interactive Rating Stars */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Select Rating</label>
              <div className="flex items-center space-x-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((starIdx) => {
                  const isActive = (hoverRating || rating) >= starIdx;
                  return (
                    <button
                      key={starIdx}
                      type="button"
                      onClick={() => setRating(starIdx)}
                      onMouseEnter={() => setHoverRating(starIdx)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-gray-300 dark:text-gray-650 hover:text-indigo-600 transition-colors focus:outline-none"
                    >
                      <Star 
                        className={`w-6 h-6 ${
                          isActive ? 'fill-amber-400 stroke-amber-400' : 'stroke-gray-300 dark:stroke-gray-700'
                        }`} 
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment Area */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Comment Box</label>
              <textarea
                required
                rows="4"
                placeholder="What did you think of the service or product?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 placeholder-gray-400 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white rounded-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitLoading || !user}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider border border-indigo-600 rounded-none shadow-sm transition-all active:scale-[0.98] disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:border-gray-200 dark:disabled:border-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:scale-100"
            >
              {submitLoading ? 'Submitting...' : 'Submit Review'}
            </button>
            
            {!user && (
              <p className="text-[10px] text-red-500 font-bold uppercase text-center mt-2">
                * Please sign in to submit feedback.
              </p>
            )}
          </form>
        </div>

        {/* FEEDBACK LIST PANEL */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-sm font-black uppercase text-black dark:text-white tracking-wider border-b pb-3 border-gray-200 dark:border-gray-850">
            Recent Customer Reviews ({feedbacks.length})
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-white dark:bg-gray-900 border dark:border-gray-850 p-5 space-y-3 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 w-1/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 w-1/2"></div>
                </div>
              ))}
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800">
              <MessageSquare className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase">No Reviews Yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((item) => (
                <div key={item.id} className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 p-5 space-y-3 shadow-2xs hover:shadow-xs transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {/* Avatar initial circle */}
                      <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-955/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-100 dark:border-indigo-900/30">
                        {item.userName ? item.userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-wide">
                          {item.userName}
                        </h4>
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 font-semibold mt-0.5 block">
                          Posted on {new Date(item.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Star ratings representation */}
                    <div className="flex items-center space-x-0.5">
                      {[1, 2, 3, 4, 5].map((starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-3.5 h-3.5 ${
                            item.rating >= starIdx
                              ? 'fill-amber-400 stroke-amber-400'
                              : 'stroke-gray-205 dark:stroke-gray-700 fill-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-gray-650 dark:text-gray-300 leading-relaxed font-semibold italic">
                    "{item.comment}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Feedback;
