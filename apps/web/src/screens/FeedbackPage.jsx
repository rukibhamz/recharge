import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import FeedbackForm from '../components/shared/FeedbackForm.jsx';

export default function FeedbackPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-xl flex-1 px-margin-mobile py-10 sm:px-8">
        <p className="hero-badge">Product</p>
        <h1 className="mt-3 font-display text-headline-lg font-light text-ink">Share feedback</h1>
        <p className="mt-2 font-sans text-body-md text-ink-soft">
          Help us make the questions, advice, and coach clearer. The team reads every submission.
        </p>
        <FeedbackForm page="feedback" className="mt-8" />
      </main>
      <Footer compact />
    </div>
  );
}
