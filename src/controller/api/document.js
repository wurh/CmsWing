const BaseRest = require('../common/rest');
module.exports = class extends BaseRest {
    /**
     * 默认最新列表
     * "/api/document/1" 调用id为1的文章
     * "/api/document/?cid=1" 调用栏目id为1的列表
     * "/api/document/?cid=0" 调用全部栏目列表
     * cid:栏目id
     * order: new:默认最新，hot:热点,
     * @returns {Promise<PreventPromise>}
     */

    async getAction(){
        let data;
        if (this.id) {
            //let pk = await this.modelInstance.getPk();
            data = await this.modelInstance.detail(this.id);
            //data.content=html_encode(data.content);
            data.catename = await this.model("category").get_category(data.category_id, "title");
            data.uid = await get_nickname(data.uid);
            data.update_time = this.moment(data.update_time).fromNow()
            return this.success(data);
        }
        let map={'pid':0, 'status': 1};
        let o = {};
        let cid = this.get('cid')||0;
        let order = this.get('order');
        if(cid !=0 && think.isNumberString(cid)){
            //获取当前分类的所有子栏目
            let subcate = await this.model('category').get_sub_category(cid);
            // console.log(subcate);
            subcate.push(cid);
            map.category_id = ['IN',subcate];
        }else if (cid == "hot") {
            o.view = 'DESC';
        }else {
            o.update_time = 'DESC';
        }
        if(order == "hot"){
            o.view = 'DESC';
        }else {
            o.update_time = 'DESC';
        }
        data = await this.modelInstance.where(map).page(this.get('page')).order(o).countSelect();
        let http_=this.config("http_")==1?"http":"https";
        let http__;
        for(let v of data.data){
            let imgarr = [];
            if(v.cover_id !=0){
                let pic = await get_pic(v.cover_id,1,360,240);
                if(pic.indexOf("//")==0){
                    http__ =`${http_}:`;
                }else {
                    http__ =`${http_}://${this.ctx.host}`;
                }
                imgarr.push(http__+pic)
            }
            if(!think.isEmpty(v.pics)){
                let pics = v.pics.split(",")
                for(let i of pics){
                    let pic = await get_pic(i,1,360,240);
                    if(pic.indexOf("//")==0){
                        http__ =`${http_}:`;
                    }else {
                        http__ =`${http_}://${this.ctx.host}`;
                    }
                    imgarr.push(http__+pic)
                }
            }
            v.imgurl=imgarr;
            v.catename = await this.model("category").get_category(v.category_id, "title");
            v.uid = await get_nickname(v.uid);
            v.update_time = this.moment(v.update_time).fromNow()
        }
        return this.success(data);
    }
}