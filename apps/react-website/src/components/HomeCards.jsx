import { Link } from 'react-router-dom';
import GlowCard from './GlowCard';
import { Briefcase, Building2 } from 'lucide-react';

const HomeCards = ({user}) => {
  const isOwner = user?.role === "owner";
  const isClient = user?.role === "client";
  const isContractor = user?.role === "contractor";
  
  const showContractor = !user || isOwner || isContractor;
  const showClient = !user || isOwner || isClient;

  return (
    <section className='py-4'>
      <div className='container-xl lg:container m-auto'>
        <div className={`grid grid-cols-1 ${showContractor && showClient ? 'md:grid-cols-2' : ''} gap-8 md:gap-12 p-4 rounded-lg mt-8`}>
          {showContractor && (
            <GlowCard innerClassName="p-6">
              <div className='flex items-center gap-3 mb-1'>
                  <Briefcase className='w-8 h-8 text-indigo-400' />
                  <h2 className='text-2xl font-bold text-white'>For Contractors</h2>
              </div>
              <p className='mt-2 mb-4 text-gray-300'>
                Browse our available jobs and start bidding today!
              </p>
              <Link
                to={user ? '/jobs' : '/login'}
                className='inline-block bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-500 transition-colors'
              >
                Browse Jobs
              </Link>
            </GlowCard>
          )}
          {showClient && (
            <GlowCard innerClassName="p-6">
              <div className='flex items-center gap-3 mb-1'>
                  <Building2 className='w-8 h-8 text-cyan-400' />
                  <h2 className='text-2xl font-bold text-white'>For Clients</h2>
              </div>
              <p className='mt-2 mb-4 text-gray-300'>
                List your job and find the perfect contractor today!
              </p>
              <Link
                to={user ? '/addjobs' : '/login'}
                className='inline-block bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-500 transition-colors'
              >
                Add Job
              </Link>
            </GlowCard>
          )}
        </div>
      </div>
    </section>
  );
};
export default HomeCards;