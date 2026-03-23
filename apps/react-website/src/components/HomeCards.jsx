import { Link } from 'react-router-dom';
import Card from './Card';

const HomeCards = ({user}) => {
  const isOwner = user?.role === "owner";
  const isClient = user?.role === "client";
  const isContractor = user?.role === "contractor";
  
  const showContractor = !user || isOwner || isContractor;
  const showClient = !user || isOwner || isClient;

  return (
    <section className='py-4'>
      <div className='container-xl lg:container m-auto'>
        <div className={`grid grid-cols-1 ${showContractor && showClient ? 'md:grid-cols-2' : ''} gap-4 p-4 rounded-lg`}>
          {showContractor && (
            <Card>
              <h2 className='text-2xl font-bold'>For Contractors</h2>
              <p className='mt-2 mb-4'>
                Browse our available jobs and start bidding today!
              </p>
              <Link
                to={user ? '/jobs' : '/login'}
                className='inline-block bg-black text-white rounded-lg px-4 py-2 hover:bg-gray-700'
              >
                Browse Jobs
              </Link>
            </Card>
          )}
          {showClient && (
            <Card bg='bg-indigo-100'>
              <h2 className='text-2xl font-bold'>For Clients</h2>
              <p className='mt-2 mb-4'>
                List your job and find the perfect contractor today!
              </p>
              <Link
                to={user ? '/addjobs' : '/login'}
                className='inline-block bg-indigo-500 text-white rounded-lg px-4 py-2 hover:bg-indigo-600'
              >
                Add Job
              </Link>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};
export default HomeCards;