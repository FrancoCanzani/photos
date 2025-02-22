import Link from 'next/link';

export default function Footer() {
  return (
    <footer className='bg-gray-50'>
      <div className='container mx-auto px-4 py-6'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
          <div>
            <h2 className='text-lg font-semibold mb-4'>About Flock</h2>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='#'
                  className='text-sm text-gray-600 hover:text-primary transition-colors'
                >
                  Our Story
                </Link>
              </li>
              <li>
                <Link
                  href='#'
                  className='text-sm text-gray-600 hover:text-primary transition-colors'
                >
                  Team
                </Link>
              </li>
              <li>
                <Link
                  href='#'
                  className='text-sm text-gray-600 hover:text-primary transition-colors'
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href='#'
                  className='text-sm text-gray-600 hover:text-primary transition-colors'
                >
                  Press
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className='text-lg font-semibold mb-4'>Features</h2>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='#'
                  className='text-sm text-gray-600 hover:text-primary transition-colors'
                >
                  Photo Sharing
                </Link>
              </li>
              <li>
                <Link
                  href='#'
                  className='text-sm text-gray-600 hover:text-primary transition-colors'
                >
                  Event Creation
                </Link>
              </li>
              <li>
                <Link
                  href='#'
                  className='text-sm text-gray-600 hover:text-primary transition-colors'
                >
                  Collaborative Albums
                </Link>
              </li>
              <li>
                <Link
                  href='#'
                  className='text-sm text-gray-600 hover:text-primary transition-colors'
                >
                  Privacy Controls
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className='text-lg font-semibold mb-4'>Support</h2>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='#'
                  className='text-sm text-gray-600 hover:text-primary transition-colors'
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href='#'
                  className='text-sm text-gray-600 hover:text-primary transition-colors'
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href='#'
                  className='text-sm text-gray-600 hover:text-primary transition-colors'
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  href='#'
                  className='text-sm text-gray-600 hover:text-primary transition-colors'
                >
                  Community Guidelines
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className='text-lg font-semibold mb-4'>Legal</h2>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='#'
                  className='text-sm text-gray-600 hover:text-primary transition-colors'
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href='#'
                  className='text-sm text-gray-600 hover:text-primary transition-colors'
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href='#'
                  className='text-sm text-gray-600 hover:text-primary transition-colors'
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  href='#'
                  className='text-sm text-gray-600 hover:text-primary transition-colors'
                >
                  GDPR Compliance
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className='mt-12 pt-8 border-t border-gray-200 text-center'>
          <p className='text-sm text-gray-600'>
            &copy; {new Date().getFullYear()} Flock. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
