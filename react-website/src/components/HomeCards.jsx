import { Link } from 'react-router-dom';
import Card from './Card';

const HomeCards = () => {
  return (
    <section className='py-4'>
      <div className='container-xl lg:container m-auto'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg'>
          <Card>
            <h2 className='text-2xl font-bold'>For Contractors</h2>
            <p className='mt-2 mb-4'>
              Browse our available jobs and start bidding today!
            </p>
            <Link
              to='/login'
              className='inline-block bg-black text-white rounded-lg px-4 py-2 hover:bg-gray-700'
            >
              Browse Jobs
            </Link>
          </Card>
          <Card bg='bg-indigo-100'>
            <h2 className='text-2xl font-bold'>For Clients</h2>
            <p className='mt-2 mb-4'>
              List your job and find the perfect contractor today!
            </p>
            <Link
              to='/login'
              className='inline-block bg-indigo-500 text-white rounded-lg px-4 py-2 hover:bg-indigo-600'
            >
              Add Job
            </Link>
          </Card>
        </div>
      </div>
    </section>
  );
};
export default HomeCards;