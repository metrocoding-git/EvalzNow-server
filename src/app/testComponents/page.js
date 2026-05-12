'use client'; 

import CreateMaterialForm from '@/components/CreateMaterialForm';
import CurveEditor from '@/components/CurveEditor';
import MaterialEditor from '@/components/MaterialEditor';
import InsertScoreClassroom from '@/components/tables/InsertScoreClassroom';
import InsertScoreWorkfoce from '@/components/tables/InsertScoreWorkfoce';
import React, { useState } from 'react';

function Page() {
  const [showMaterialEditor, setShowMaterialEditor] = useState(true);

  return (
    <div className='m-3' >
      {showMaterialEditor && (
        <MaterialEditor onClose={() => setShowMaterialEditor(false)} />
      )}

      <CreateMaterialForm />
      
      <CurveEditor/>
      
      <InsertScoreWorkfoce/>

      <InsertScoreClassroom/>

  
    </div>
  );
}

export default Page;
